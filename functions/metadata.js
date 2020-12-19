/*
==========================================
       Kodi Film Library Maintainer        
==========================================
         Film Metadata Searcher
------------------------------------------ 
*/
class Metadata {

    constructor() {
        
        this.modulesRequired = {
            download: require('../functions/download'),
            opensubtitles: require('../functions/opensubtitles'),
            cache: require('../functions/cache')
        }

        this.download = new this.modulesRequired.download();
        this.opensubtitles = new this.modulesRequired.opensubtitles();
        this.cache = new this.modulesRequired.cache();

        this.constants = require('../config/constants.json');  
        this.languages = require('../config/languages.json'); 

        if (typeof global.settings !== 'object') global.settings = require('../config/settings.json');

        this.cacheSuffix = 'meta';
    }

    details(video, data, callback) {
        var self = this;

        let searchTitle = video.filmName ? video.filmName : video.basicName;
        let searchYear = video.year ? video.year : null;
        let cycleFinished = false;
        let meta = {
            title: null,
            year: null,
            imdbid: null,
            tmdbid: null,
            language: null,
            plot: null
        };

        add(data);
        cache();
    
        function add(data) {
            Object.keys(meta).forEach(function(key){
                if (meta[key]) return;
                let value = data[key];
                if (!value ||  (typeof value !== 'string' && typeof value !== 'number')) return;
                meta[key] = value;
            });
        }

        function validate() {
            return (meta.title && meta.plot && (meta.imdbid || meta.tmdbid) && meta.year && meta.language) ? true : false;
        }

        function progress(response, nextStep) {
            if (response.success && response.match && response.details) add(response.details);
            self.cache.save(video.base, self.cacheSuffix, meta);

            if (!validate() && nextStep) nextStep();
            else callback(meta);
        }

        function cache() {
            let cache = self.cache.get(video.base, self.cacheSuffix);
            let response = {success: cache.success};
            response.match = cache.success;
            if (cache.success) response.details = cache.data;
            progress(response, omdbId);
        }

        function omdbId() {
            self.omdbId(meta.imdbid, function(response){
                progress(response, tmdbId);
            });
        }

        function tmdbId() {
            self.tmdbId(meta.tmdbid, function(response){
                progress(response, omdbTitle);
            });
        }

        function omdbTitle() {
            self.omdbTitle(searchTitle, searchYear, function(response){
                progress(response, tmdbTitle);
            });
        }

        function tmdbTitle(){
            self.tmdbTitle(searchTitle, searchYear, function(response){       
                progress(response, opensubtitlesHash);
            });
        }

        function opensubtitlesHash() {
            if (cycleFinished) return progress({success: true, match: false}, null);

            self.opensubtitles.film(video.fullpath, function(response){
                if (!response.success || !response.match) progress(response, null);
                else {
                    cycleFinished = true;
                    progress(response, omdbId);
                }
            });
        }  
    }

    omdbId(imdbid, callback) {
        var self = this;
        if (!imdbid) return callback({success: true, match: false});
        let url = this.constants.api.omdb+"?apikey="+global.settings.omdbapi+"&i="+imdbid;
                
        this.download.get(url, false, function(response){
            callback(self.omdbResponse(response));  
        });
    }
    
    omdbTitle(title, year, callback) {
        var self = this;
        if (!title) return callback({success: true, match: false});
        let url = this.constants.api.omdb+"?apikey="+global.settings.omdbapi+"&type=movie&t="+title+(year ? "&y="+year : '');
        
        this.download.get(url, false, function(response){
            callback(self.omdbResponse(response)); 
        });
    }

    omdbResponse(response, callback) {
        var self = this;

        if (!response.success) return response;
    
        let data = {};

        try {
            data = JSON.parse(response.data);
        } catch(err) {
            return {success: false, error: err.message};
        }

        if (data.Response == 'False') {
            if (data.Error == 'Movie not found!' || data.Error == 'Incorrect IMDb ID.') return {success: true, match: false};
            else return {success: false, error: data.Error};
        }

        let obj = {success: true,
            match: true,
            details: {}
        };
        
        let fields = [
            ['Title', 'title'], 
            ['Plot', 'plot'], 
            ['imdbID', 'imdbid']
        ];

        fields.forEach(function(key){
            if (data[key[0]]) obj.details[key[1]] = data[key[0]];
        });

        if (data.Year) obj.details.year = parseInt(data.Year);
        
        if (data.Language) {
            let langArr = data.Language.split(',');

            langArr.forEach(function(lang){
                if (obj.details.language) return;
                let match = self.language(lang.trim());
                if (match) obj.details.language = match;
            }); 
        }
            
        return obj;
    }

    tmdbTitle(title, year, callback) {
        var self = this;
        if (!title) return callback({success: true, match: false});
        let url = this.constants.api.tmdb+"search/movie?language=en-US&page=1&include_adult=false&api_key="+global.settings.tmdbapi+"&query="+title+(year ? "&year="+year : '');

        this.download.get(url, false, function(response){
            if (!response.success) return callback(response);
        
            let data = {};

            try {
                data = JSON.parse(response.data);
            } catch(err) {
                return callback({success: false, error: err.message});
            }

            if (data.success === false) return callback({success: false, error: data.status_message});
            if (data.total_results === 0) return callback({success: true, match: false});

            self.tmdbId(data.results[0].id, callback);
        });
    }

    tmdbId(tmdbid, callback) {       
        var self = this;
        if (!tmdbid) return callback({success: true, match: false});
        let url = self.constants.api.tmdb+"movie/"+tmdbid+"?api_key="+global.settings.tmdbapi+"&language=en-US";

        this.download.get(url, false, function(response){
           
            if (!response.success) return callback(response);
    
            let data = {};
    
            try {
                data = JSON.parse(response.data);
            } catch(err) {
                return callback({success: false, error: err.message});
            }

            if (data.success === false) return callback({success: false, error: data.status_message});

            let obj = {
                success: true,
                match: true,
                details: {
                    title: data.title,
                    plot: data.overview,
                    imdbid: data.imdb_id || null,
                    tmdbid: data.id
                }
            };

            let fields = [
                ['title', 'title'], 
                ['overview', 'plot'], 
                ['imdb_id', 'imdbid'], 
                ['id', 'tmdbid']
            ];

            fields.forEach(function(key){
                if (data[key[0]]) obj.details[key[1]] = data[key[0]];
            });
    
            if (data.release_date) obj.details.year = parseInt(data.release_date.substr(0, 4));
            if (data.original_language) obj.details.language = self.language(data.original_language);

            callback(obj);
        });
    }

    language(needle) {
        let response = null;

        this.languages.some(function(arr, index) {
            if (arr.indexOf(needle) !== -1) return response = arr[1];
        });

        return response;
    }
}
module.exports = Metadata;