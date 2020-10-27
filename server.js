const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const google_api_key = "AIzaSyBrRh0NjtrSopoOrG-4_W3OP0nmzSDQK-M";

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse application/json
app.use(bodyParser.json())

// define a base route
app.get('/', (req, res) => {
        res.json({"message": "Gozem backend developper test."});    
});

app.post('/api/get_distance_and_time', (req, res) => {
    if (Object.keys(req.body).length === 0) {
        return res.status(400).send({
            message: "Define properties in body"
        });
     }else if(req.body.hasOwnProperty('start')&&req.body.hasOwnProperty('end')&&
     req.body.hasOwnProperty('units')){
        finalFunction(req,res);
    }else{
        return res.status(400).send({
            message: "Verify properties"
        });
    }
});

// getting country name from geo coordinates function using google geocode reverse api
function getCountry (lat,lng,cb){
    var geocoding = new require('reverse-geocoding-google');
    var toreturn = 'null'
    var params = {
        'latitude': lat,
        'longitude': lng,
        'key': google_api_key
    };
    geocoding.location(params, function (err, data){
        if(err){
            console.log(err);
            return cb(null,err);
        }else{
            console.log('calling',data.results[0].address_components[4].long_name);
            r = data.results[0].address_components[4].long_name;
            toreturn=r;
            return cb(toreturn); 
        }
        
    });
  }

  // getting a geo location timezone infos function using google timezone api
  function getTimeZoneInfo (lat,lng,cb){
    var toreturn = 'null'
    var timezone = require('node-google-timezone');
    var timestamp =Date.now()/1000;
    console.log('timestamp',timestamp);
    timezone.key(google_api_key);
    timezone.data(lat,lng, timestamp, function (err, tz) {
    if(err){
        console.log(err);
        return cb(err);
    }else{
        var d = new Date(tz.local_timestamp * 1000);
        var utc = '';
        utcValue = (tz.raw_response.rawOffset/3600);
        if (utcValue < 0) { 
            utc = 'GMT-'+(-utcValue-1)
        } else {
            utc = 'GMT+'+(utcValue-1)
        }
        r = {'utc':utc,'heure':d.getUTCHours()};
        toreturn=r;
        return cb(toreturn);
    }
   
  });
  }

  // calculte distance between two geo locations function using google distance matrix api
  function calculteDistanceBetweenTwoCoordonates (origin,dest,units,cb){
    var toreturn = 'null';
    var distance = require('google-distance-matrix');
    var origins = [origin];
    var destinations = [dest];
    distance.key(google_api_key)
    distance.units(units)
    distance.matrix(origins, destinations, function (err, distances) {
        if(err){
            console.log(err);
            return cb(err);
        }else{    
            toreturn=distances.rows[0].elements[0].distance.text;
            return cb(toreturn);
        }
       
    })
  }

  // final function
  function finalFunction(req,res){
    start = req.body.start
    end = req.body.end
    // Getting countries for start and end points
    // ---- Country Name for start geo location
    getCountry(start.lat,start.lng, function(startCountry){
    console.log('start country',startCountry);
        // ---- Country Name for start geo location
        getCountry(end.lat,end.lng, function(endCountry){
        console.log('ennd country',startCountry);
            // Getting timezone info for start and end points
            // ---- timezone for start geo location
            getTimeZoneInfo(start.lat,start.lng, function(startTz){
                console.log('start TZ',startTz);
                    // ---- timezone for start geo location
                    getTimeZoneInfo(end.lat,end.lng, function(endTz){
                    /* ************************ Distance ************************* */
                        origins=[start.lat,start.lng]
                        dest=[end.lat,end.lng]
                        calculteDistanceBetweenTwoCoordonates(origins,dest,req.body.units,function(distance){
                            // formating return object
                            toreturn_start = {"country":startCountry,"timezone":startTz.utc,"location":{"lat":start.lat,"lng":start.lng}}
                            toreturn_end = {"country":endCountry,"timezone":endTz.utc,"location":{"lat":end.lat,"lng":end.lng}}
                            toreturn_distance={"value":distance.split('km')[0],"units":"km"}
                            toreturn_timedif={"value":Math.abs(endTz.heure-startTz.heure),"units":"hours"}
                            toreturn= {"start":toreturn_start,"end":toreturn_end,"distance":toreturn_distance,"time_diff":toreturn_timedif}
                            res.send(toreturn)
                        });
                    /* **************************************************** */
                    
                    })
            })
        })
})
  }

// listen for requests
app.listen(7000, () => {
    console.log("Server is listening on port 7000");
});



 