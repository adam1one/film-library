/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
            Subtitle Element
------------------------------------------

Analyses subtitle filenames
*/
class Subtitle {
    constructor(videos) {
    
        this.modulesRequired = {
            string: require('../functions/string'),
        }

        this.string = new this.modulesRequired.string();

        this.constants = require('../config/constants.json');    
        this.languages = require('../config/languages.json');    
       
        this.videos = videos;
    }

    analyse(file) {
        file.language = null;
        file.matchRank = 0; 
        file.rankings = {};

        this.determineLanguage(file);
        this.rankVideos(file);
    }

    determineLanguage(file) {
        var self = this;
        let stripped = file.name.toLowerCase();

        if (file.isPart) stripped = stripped.replace(file.partSuffix.toLowerCase(), '');

        self.videos.forEach(function(file){
            stripped = stripped.replace(file.basicName.toLowerCase(), '');
        });
        
        stripped = stripped.trim();
        if (stripped.substring(0, 1) === '.') stripped = stripped.substr(1, stripped.length - 1);
        
        if (!stripped.length) return  file.language = this.constants.defaultlang;

        check(0);

        function check(level = 0) {
			let BreakException = {};

			try {
				self.languages.forEach(function(codes, index){
                    let code = codes[level];
					
                    if (self.string.search(stripped, code)) {
                        if (level === 0 || code.length == stripped.length) {
                            file.language = codes;
                            file.matchRank = 3 - level;
							throw BreakException;
                        }
						else if (self.string.suffix(stripped, code) && !stripped.substr(stripped.length - code.length - 1, 1).match(/[a-z]/i)) {
                            file.language = codes;
                            file.matchRank = 3 - level;
                            throw BreakException;
						}
                    }
				});
			}
			catch (e) {
				if (e !== BreakException) throw e;
			}

            if (!file.language) {
                if (level < 2) check(level + 1); 
                else file.language = self.constants.defaultlang;
            }
		}
    }

    rankVideos(file) {
        var self = this;

        this.videos.forEach(function(video){            
            let rank = file.matchRank

            if (video.isPart && file.isPart && video.partNum == file.partNum) rank += 20;
            if (self.string.prefix(file.name, video.basicName)) rank += 10;
            if (file.dir === video.dir) rank += 5;

            file.rankings[video.path] = rank;
        });    
    }
}
module.exports = Subtitle;