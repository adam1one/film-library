/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
          Film Details Element
------------------------------------------
Gets metadata from nfo, language file, or web
Gets language from hidden file in film directory because Kodi omits it in their nfos
All other metadata found in nfo file
*/
class Details {
    constructor() {

        this.parser = require('fast-xml-parser');
        this.he = require('he');

        this.modulesRequired = {
            library: require('../functions/library'),
            metadata: require('../functions/metadata')
        }

        this.library = new this.modulesRequired.library();
        this.metadata = new this.modulesRequired.metadata();

        this.languages = require('../config/languages.json');  
        this.langFilename = require('../config/constants.json').langfilename;

        this.data = {
            nfoFile: null,
            langFile: null,
            details: {
                title: null,
                year: null,
                imdbid: null,
                tmdbid: null,
                language: null,
                plot: null
            }
        };
    }

    analyse(nfos, videos, filmPath, callback) {
        var self = this;
        this.videos = videos;

        nfos.forEach(function(file){
            if (!self.data.nfoFile) self.parseXML(file);
        });
    
        this.parseLanguage(filmPath);
        
        if (this.validate()) return callback({success: true, match: true, data: self.data});
 
        let i = 0, num = videos.length;

        search(videos[i]);

        function search(video) {
            self.metadata.details(video, self.data.details, function(response){

                Object.keys(response).forEach(function(key){
                    self.add(key, response[key]);
                });
            
                if (self.validate()) callback({success: true, match: true, data: self.data});
                else {
                    i++;
                    if (i < num) search(videos[i]);
                    else callback({success: true, match: false});
                } 
            });  
        }
    }

    parseXML(file) {
        var self = this;

        let xmlData = this.library.read(file.path).data;
        if (!this.parser.validate(xmlData)) return;

        let hasId = false;
               
        const options = {
            ignoreAttributes : false, 
            parseAttributeValue: true,
            attrValueProcessor: (val, attrName) => self.he.decode(val, {isAttributeValue: true}),
            tagValueProcessor: (val, tagName) => self.he.decode(val), 
        };

        let obj =  this.parser.parse(xmlData, options);
        if (!obj.movie) return;

        this.add('title', obj.movie.title);
        this.add('year', obj.movie.year);
        this.add('plot', obj.movie.plot);
        
        if (typeof obj.movie.uniqueid === 'object') {
            if (obj.movie.uniqueid.length) {
                Object.keys(obj.movie.uniqueid).forEach(function(key){
                    id(obj.movie.uniqueid[key]);
                });
            }
            else id(obj.movie.uniqueid);
        }
 

        function id(node) {
            if (node['@_type'] == 'imdb' && node['#text']) {
                self.add('imdbid', node['#text']);
                hasId = true;
            }
            else if (node['@_type'] == 'tmdb' && node['#text']) {
                self.add('tmdbid', node['#text']);
                hasId = true;
            }
        }

        if (obj.movie.title && obj.movie.year && obj.movie.plot && hasId) this.data.nfoFile = file;
    }

    parseLanguage(filmPath) {
        var self = this;

        if (!filmPath) return;

        let path = filmPath+'/'+this.langFilename;
        if (!this.library.exists(path)) return;

        let file = this.library.info(path);
        let str = this.library.read(path).data.substr(0, 3);
        let match = false;

        this.languages.forEach(function(arr){
            if (arr[1] == str) {
                self.data.details.language = str;
                self.data.langFile = file;
            }
        });
    }

    add(name, value) {
        if (!value || this.data.details[name]) return;
        else if (typeof value !== 'string' && typeof value !== 'number') return;
        else if (this.data.details[name] === undefined) return;
        this.data.details[name] = value;
    }

    validate() {
        return (this.data.details.title && this.data.details.plot && (this.data.details.imdbid || this.data.details.tmdbid) && this.data.details.year && this.data.details.language) ? true : false;
    }
}
module.exports = Details;