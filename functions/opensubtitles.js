/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
         OpenSubtitles Interface
------------------------------------------

Requests are delayed by 300ms to avoid rate limit (40 per 10s)
Records login token to global.opensubtitles_token
Records failed requests in 'global.failed_requests'
Blocks after 5 failed requests
*/
class OpenSubtitles {

    constructor() {

        this.zlib = require('zlib'); 
         
        this.modulesRequired = {
            osapi: require('opensubtitles-api'),
            cache: require('../functions/cache')
        }
        
        this.cache = new this.modulesRequired.cache();

        if (typeof global.settings !== 'object') global.settings = require('../config/settings.json');
        if (typeof failed_requests !== 'object') global.failed_requests = {};
        
        this.constants = require('../config/constants.json');    

        this.token = (typeof global.opensubtitles_token === 'string') ? global.opensubtitles_token : null;
        this.cacheSuffix = 'sub.'+global.settings.language[1];

        this.os = new this.modulesRequired.osapi({
            useragent: this.constants.os.useragent,
            username: global.settings.osuser,
            password: global.settings.ospass,
            ssl: true
        });
    }

    // Film lookup by hash (last resort - very slow)
    film(fullpath, callback) {
        var self = this;

        this.prepare(function(response){
            if (!response.success) callback(response);
            else ready();
        });

        function ready(){

            self.os.identify({
                path: fullpath,
            })
            .then(data => {
                let response = {success: true};

                if (data.metadata && data.metadata.imdbid) {
                    response.match = true;
                    response.details = {imdbid: data.metadata.imdbid};
                }
                else response.match = false;

                callback(response);
            })
            .catch(err => {
                self.logFail();
                callback({success: false, error: err.message});
            });
        }
    }

    subtitle(video, imdbid, callback) {   
        var self = this;

        let response = this.cache.get(video.base, self.cacheSuffix);
        if (response.success) return callback(response.data);

        let language = global.settings.language;

        this.prepare(function(response){
            if (!response.success) callback(response);
            else ready();
        });

        function ready(){     
            self.os.search({
                sublanguageid: language[1], 
                path: video.fullpath,
                filename: video.base,
                imdbid: imdbid,          
                extensions: [self.constants.os.format],
                gzip: true
            }).then(response =>{
                let obj = {success:true};

                if (response[language[2]]) {
                    obj.match = true;
                    obj.data = {
                        url: response[language[2]].url,
                        encoding: response[language[2]].encoding,
                        ext: '.'+self.constants.os.format,
                        language: response[language[2]].lang
                    }
                }
                else obj.match = false;

                self.cache.save(video.base, self.cacheSuffix, obj);
                callback(obj);
            }).catch(err => {
                self.logFail();
                callback({success: false, error: err.message});
            });
        }
    }

    prepare(callback) {
        var self = this;

        if (global.failed_requests[this.constants.os.host] === undefined) global.failed_requests[this.constants.os.host] = 0;
        else if (global.failed_requests[this.constants.os.host] >= 5) return callback({success: false, error: 'Max failed attempts reached.'});

        if (this.token) rateLimit();
        else {

            self.os.login()
            .then(res => {
                self.token = res.token;
                rateLimit()
            })
            .catch(err => {
                self.logFail();
                callback({success: false, error: err.message})
            });
        }
    
        function rateLimit() {
            setTimeout(() => {
                callback({success: true});
            }, 300);
        }
    }

    logFail(){
        global.failed_requests[this.constants.os.host]++;     
    }
}
module.exports = OpenSubtitles;