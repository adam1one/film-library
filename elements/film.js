/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
              Film Element
------------------------------------------

Represents a top-level directory, or a video file in top-level directory
*/
class Film {
    constructor(info, topLevelFiles = null) {
        var self = this; 

        this.modulesRequired = {
            detail: require('./detail'),
            subtitle: require('./subtitle'),
            library: require('../functions/library'),
            string: require('../functions/string'),
            opensubtitles: require('../functions/opensubtitles')
        }

        this.library = new this.modulesRequired.library();
        this.string = new this.modulesRequired.string();

        if (typeof global.settings !== 'object') global.settings = require('../config/settings.json');

        this.constants = require('../config/constants.json');    

        this.callback = null;

        this.name = info.name;
        this.dir = info.dir;
        this.isDirectory = info.isDirectory;
        this.properName = null;
       
        this.nfoFile = null;
        this.langFile = null;
        this.details = null;
        this.subtitleDL = null;
      
        this.hasParts = false;
        this.partIntegrity = null;

        this.subtitles = [];
        this.files = {
            all: [], 
            valid: [], 
            invalid: [],
            types: {
                video: [], 
                subtitle: [], 
                nfo: [], 
                image: [],
            },    
        };

        if (info.isDirectory) {
            this.path = info.path;
            this.base = info.path;
            this.fullpath = info.fullpath;
            this.files.all = this.library.list(this.path, null, true);
        }
        else {
            this.path = info.dir;
            this.base = info.base;
            this.fullpath = global.settings.libpath;

            topLevelFiles.forEach(function(file){
                if (self.string.prefix(file.name, info.basicName)) self.files.all.push(file);
            });  
        }

        this.files.all.forEach(function(file){
            if (self.files.types[file.type]) self.files.types[file.type].push(file);
            else self.files.invalid.push(file);
        });
    }

    analyse(callback) {
        var self = this;

        this.callback = callback;

        let result = this.identifyVideos();
        if (!result.success) return self.warn(result.error);
    
        this.checkImages();
        this.checkSubtitles();

        let detail = new this.modulesRequired.detail();

        detail.analyse(this.files.types.nfo, this.files.types.video, this.path, function(response){
          
            if (!response.success) return self.error(result.error);
            if (!response.match) return self.warn('Cannot identify film');

            self.details = response.data.details;
            self.properName = self.details.title+' ('+self.details.year+')';

            if (response.data.langFile) self.langFile = response.data.langFile;
            
            if (response.data.nfoFile) {
                self.nfoFile = response.data.nfoFile;
                self.files.valid.push(self.nfoFile);
            }
            else self.log("Identified \""+self.properName+"\"");
 
            self.files.types.nfo.forEach(function(file){
                if (file !== self.nfoFile) self.files.invalid.push(file);
            }); 

            self.subtitleSearch();
        });
    }

    identifyVideos() {
        var self = this;
        let subtitles = this.files.types.subtitle;

        switch (this.files.types.video.length) {
            case 0:
                return {success: false, error: 'No video file found in directory'};
            
            case 1:
                this.files.types.video[0].valid = true;
                this.files.types.video[0].isPart = false;
                this.files.types.video[0].partNum = null;
                this.files.valid.push(this.files.types.video[0]);
                return {success: true};        
        }

        self.partIntegrity = self.checkPartIntegrity();
                
        if (self.partIntegrity) { 
            this.files.types.video.forEach(function(file){
                file.valid = true;
                self.files.valid.push(file);
            });
            
            self.hasParts = true;
            return {success: true};
        }

        let largest = {index: null, size: 0};

        this.files.types.video.forEach(function(file, index){            
            if (file.size > largest.size) {
                largest.index = index;
                largest.size = file.size;
            }
        });

        this.files.types.video.forEach(function(file, index){ 
            if (index === largest.index) {
                file.valid = true;
                file.isPart = false;
                file.partNum = null;
                self.files.valid.push(file);
            }
            else {
                file.valid = false;
                self.files.invalid.push(file);
            }
        });

        return {success: true};
    }

    checkPartIntegrity() {
        let valid = true;

		for (var i = 1; i <= this.files.types.video.length; i++) {
			let num = 0;

			this.files.types.video.forEach(function(file){
                if (!file.isPart) valid = false;
				else if (file.partNum === i) num++;
			});

			if (num !== 1) valid = false;
        }
        
	    return valid;
    }

    checkImages() {
        var self = this;
        let matches = {};

        this.constants.metasuffix.forEach(function(suffix){
            matches[suffix] = false;

            self.files.types.image.forEach(function(image){
                
                if (matches[suffix] || image.suffix) return;

                if (image.base === self.name+suffix) {
                    matches[suffix] = true;
                    image.suffix = suffix;   
                    return;
                }

                self.files.types.video.forEach(function(video){
                    if (matches[suffix] || image.suffix) return;

                    if (image.base === video.name+suffix) {
                        matches[suffix] = true;
                        image.suffix = suffix;   
                    }
                });
            });
        });
    
        
        self.files.types.image.forEach(function(image){
            if (image.suffix) self.files.valid.push(image);
            else self.files.invalid.push(image);
        });
    }

    checkSubtitles() {
        var self = this;
        let paths = {};

        let subtitle = new this.modulesRequired.subtitle(this.files.types.video);

        this.files.types.subtitle.forEach(function(file){
            subtitle.analyse(file);
        });

        this.files.types.video.forEach(function(video){
            if (!video.valid) return;
            let checkPart = (video.isPart && video.partNum > 1);
            let matrix = {};

            self.files.types.subtitle.forEach(function(file) {
                if (checkPart && (!file.isPart || file.partNum != video.partNum)) return;    
                
                let lang = file.language[1], ext = file.ext;
                if (matrix[lang] === undefined) matrix[lang] = {};
                if (matrix[lang][ext] === undefined || file.rankings[video.path] > matrix[lang][ext][0].rankings[video.path]) matrix[lang][ext] = [file, video.isPart, video.partNum];
            });

            Object.keys(matrix).forEach(function(lang){
                Object.keys(matrix[lang]).forEach(function(ext){
                    let arr = matrix[lang][ext];
                    paths[arr[0].path] = [arr[1], arr[2]]; 
                });
            });
        });

        self.files.types.subtitle.forEach(function(file) {
    
            if (paths[file.path] !== undefined) {
                file.isPart = paths[file.path][0];
                file.partNum = paths[file.path][1];
                self.files.valid.push(file);
            }
            else self.files.invalid.push(file);
        });  
    }

    subtitleSearch() {
        var self = this;

        let lang = global.settings.language[1];

        if (lang == self.details.language) return self.report();
        
        let match = false;

        self.files.types.subtitle.forEach(function(file){
            if (file.language[1] == lang) match = true;
        });

        if (match) return self.report();
        
        let opensubtitles = new this.modulesRequired.opensubtitles();
        
        let i = 0, num = self.files.types.video.length;

        search(self.files.types.video[i]);

        function search(video) {
            opensubtitles.subtitle(video, self.details.imdbid, function(response){

                if (!response.success) return self.report();

                if (response.match) {
                    self.subtitleDL = response.data;
                    self.log("Found "+global.settings.language[0]+" subtitles for \""+self.properName+"\"");
                    self.report();
                }
                else {
                    i++;
                    if (i < num) search(self.files.types.video[i]);
                    else self.report();
                } 
            });  
        }
    }
    
    report() {
        var self = this;
        let actions = {createDir: [], renameDir: [],renameFile: [],deleteDir: [],deleteFile: [],reviewDir: [],reviewFile: [],nfoFile: [],langFile: [],subtitle: []};

        let filename = self.string.clean(self.properName);
        let path = filename+'/'+filename;

        if (self.path != filename) {
            if (self.library.exists(filename)) return self.warn('Duplicate film');
            if (!self.path) actions.createDir.push(filename);
            else actions.renameDir.push([self.path, filename]);
        }

        if (!self.nfoFile) actions.nfoFile.push([path+'.nfo', self.details]);
        if (!self.langFile) actions.langFile.push([filename+'/'+self.constants.langfilename, self.details.language]);
        if (self.subtitleDL) actions.subtitle.push([path+(self.hasParts ? ' part1' : '')+'.'+global.settings.language[0]+self.subtitleDL.ext, self.subtitleDL]);

        self.files.valid.forEach(function(file){
            let newPath = path;

            switch (file.type) {
                case 'video':
                    newPath += (file.isPart ? ' part'+file.partNum : '')+file.ext;
                    break;

                case 'subtitle':
                    newPath += (file.isPart ? ' part'+file.partNum : '')+'.'+file.language[0]+file.ext;
                    break;

                case 'image':
                    newPath += file.suffix;
                    break;

                case 'nfo':
                    newPath += file.ext;
                    break;
                
                default:
                    return;
            }

            if (newPath != file.path) actions.renameFile.push([file.path, newPath]);
        });

        self.files.invalid.forEach(function(file){
            if (file.isDirectory) actions.deleteDir.push(file.path);
            else {
                if (file.type == 'video') actions.reviewFile.push(file.path);
                else actions.deleteFile.push(file.path);
            } 
        });

        this.callback({action: 'done', actions: actions});
    }
   
    log(message) {
        this.callback({action: 'log', message: message});
    }

    warn(message) {
        this.callback({action: 'warn', error: message, path: this.base, isDirectory: this.isDirectory});
    }

    error(message) {
        this.callback({action: 'error', error: message, path: this.base, isDirectory: this.isDirectory});
    }
}
module.exports = Film;