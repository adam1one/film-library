/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
             Welcome Window
------------------------------------------
*/
class WelcomeWindow {

    constructor() {

        var self = this;
        this.blessed = require('blessed');

        this.contentContainer = this.blessed.box({
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            hidden: true
        });


        this.textContainer = this.blessed.box({
            parent: this.contentContainer,
            top: 0,
            left: "center",
            height: 18,
            width: 102
        });


        this.leftHalf = this.blessed.box({
            parent: this.textContainer,
            top: 3,
            left:0,
            bottom: 0,
            width: 38
        });  

        this.rightHalf = this.blessed.box({
            parent: this.textContainer,
            top: 3,
            right:0,
            bottom: 0,
            width: 70,
        });  

        this.leftHeading = this.blessed.text({
            parent: this.leftHalf,
            left:"center",
            top: 0,
            width: 20,
            height: 1,
            style: {
                bold: true,
                underline: true
            },
            content: "Ideal File Structure"
        });  

        let strTree = `library
    +-- film
    |   +-- film.mp4
    |   +-- film.Language.srt
    | or
    |   +-- film part1.mp4
    |   +-- film part1.Language.srt
    |   +-- film part2.mp4
    |   +-- film part2.Language.srt
    | plus
    |   +-- film.nfo
    |   +-- film-fanart.jpg
    |   +-- film-poster.jpg
    |   +-- film-thumb.jpg
    \`-- +-- film.jpg`;

        this.fileTree = this.blessed.text({
            parent: this.leftHalf,
            left:"center",
            top: 2,
            width: 35,
            content: strTree
        }); 
    
        this.headingFeatures = this.blessed.text({
            parent: this.rightHalf,
            left: "center",
            top: 0,
            height: 1,
            style: {
                bold: true,
                underline: true
            },
            content: "Features"
        });  

        this.features = this.blessed.text({
            parent: this.rightHalf,
            left: "center",
            top: 1,
            height: 8,
            width: "100%",
            tags: true,
            padding: {
                left: 5
            }
        });         

        this.headingNotes = this.blessed.text({
            parent: this.rightHalf,
            left: "center",
            top: 11,
            height: 1,
            style: {
                bold: true,
                underline: true
            },
            content: "Notes"
        });  

        this.notes = this.blessed.text({
            parent: this.rightHalf,
            left: "center",
            top: 12,
            height: 8,
            width: "100%",
            tags: true,
            padding: {
                left: 5
            }
        }); 

        this.proceedButtonText = 'Begin';
    }

    before() {

        this.features.content = `
- Highly-automated film library maintainer

- Renames and deletes files to create ideal file structure

- Retrieves missing metadata and creates Kodi NFO files

- Downloads missing subtitles for films not in chosen language`;

        this.notes.content = `
- Review tasks carefully as deleted files cannot be recovered!

- See website for more information

{light-black-fg}Source: github.com/adam1one/film-library{/}`;
    }
}
module.exports = WelcomeWindow;