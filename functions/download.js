/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
              Downloader
------------------------------------------

Records failed requests in 'global.failed_requests'
Blocks a host after 5 failed requests
*/
class Download {
    constructor() {
        this.http = require('http');
        this.https = require('https');
        this.zlib = require('zlib'); 
        this.iconv = require('iconv-lite');
        
        this.modulesRequired = {
            library: require('../functions/library'),
            string: require('../functions/string')
        }
   
        this.library = new this.modulesRequired.library();
        this.string = new this.modulesRequired.string();

        if (typeof failed_requests !== 'object') global.failed_requests = {};
        this.constants = require('../config/constants.json');    
    }

    get(url, outputBuffer = false, callback) {
        let apiUrl = new URL(url);
        let host = apiUrl.hostname;

        if (global.failed_requests[host] === undefined) global.failed_requests[host] = 0;
        else if (global.failed_requests[host] >= 5) return callback({success: false, error: 'Max failed attempts reached.'});
    
        let getFunction = apiUrl.protocol == 'https:' ? this.https : this.http;

        const request = getFunction.get(url, {timeout: 30000}, (res) => {
            let data = [];
        
            if (res.statusCode > 400 && res.statusCode < 499) {
                global.failed_requests[host]++;
                return callback({success: false, error: res.statusCode+' '+res.statusMessage});
            }
           
            res.on('data', (chunk) => {
                data.push(chunk);
            });
        
            res.on('end', () => {
                let output = outputBuffer ? Buffer.concat(data) : data.join();
                callback({success: true, data: output});
            });
        }).on('timeout', () => {
            request.abort();
        }).on('error', (e) => {
            global.failed_requests[host]++;
            callback({success: false, error: e.reason ? e.reason : (e.code ? e.code : 'Unknown error')});
        });
    }

    subtitle(url, path, encoding, callback) {
        var self = this;
    
        if (global.failed_requests[this.constants.os.host] === undefined) global.failed_requests[this.constants.os.host] = 0;
        else if (global.failed_requests[this.constants.os.host] >= 5) return callback({success: false, error: 'Max failed attempts reached.'});

        // Avoid rate limit
        setTimeout(() => {
            self.get(url, true, function(response){
                if (!response.success) return callback(response);   
                unzip(response.data);
            }); 
        }, 300);

        function unzip(data) {
            self.zlib.unzip(data, function(error, result){
                if (error) return callback({success: false, error: error.message});
                
                let subtitleStr;

                if (!encoding || !self.iconv.encodingExists(encoding)) {
                    const fs = require('fs');
                    const detectCharacterEncoding = require('detect-character-encoding');
                    const charsetMatch = detectCharacterEncoding(Buffer.from(result));
                    encoding = charsetMatch.encoding;
                }

                try {
                    subtitleStr = self.iconv.decode(Buffer.from(result), encoding);
                } catch(err) {
                    return {success: false, error: 'Error decoding subtitle file. Encoding: "'+encoding+'"'};
                }

                strip(subtitleStr);
            });
        }

        function strip(subtitleStr) {
            let subtitleArr = subtitleStr.trim().split("\r\n");
            let lastBlank = subtitleArr.length - 1;
     
            while (subtitleArr[lastBlank] != '') {
                lastBlank--;
            }
     
            let match = false, lastBlock = subtitleArr.slice(lastBlank);
     
            lastBlock.forEach(function(line){
    
                if (self.string.search(line, '-->')) {
                    if (match) return;

                    let times = line.split('-->');
                    if (times.length != 2) return;
                    if (!self.string.search(times[0], ',') || !self.string.search(times[1], ',')) return;

                    times[0] = times[0].split(',');
                    times[1] = times[1].split(',');       

                    if (times[0].length != 2 || times[1].length != 2) return;
                    
                    let start = new Date("01/01/2007 " + times[0][0]).getTime();
                    let end = new Date("01/01/2007 " + times[1][0]).getTime();

                    if (!start || !end) return;
                    
                    if (end - start > 30000) {
                        subtitleArr.splice(lastBlank);;
                        match = true;
                    }     
                }
            });
            
            subtitleStr = subtitleArr.join("\r\n").trim();
            save(subtitleStr); 
        }

        function save(subtitleStr) {
            let response = self.library.write(path, subtitleStr);
            if (!response.success) callback(response);
            else callback({success: true, path: path});
        }
    }
}
module.exports = Download;