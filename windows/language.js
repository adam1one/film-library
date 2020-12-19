/*
==========================================
       Kodi Film Library Maintainer        
==========================================
         Subtitle Language Window
------------------------------------------ 
*/
class LanguageWindow {

    constructor() {

        var self = this;
        this.blessed = require('blessed');

        this.selectedButtons = [];
        this.unselectedButtons = [];

        this.contentContainer = this.blessed.box({
            left:0,
            right: 0,
            top: 0,
            bottom: 0,
            hidden: true,
        });

        this.heading = this.blessed.text({
            parent: this.contentContainer,
            left:"center",
            top: 1,
            height: 1,
            style: {
                bold: true,
                underline: true
            },
            content: "Subtitle Language"
        });  

        this.buttonContainer = this.blessed.radioset({
            parent: this.contentContainer,
            top: 4,
            height: 17,
            width: 62,
            left: "center",
        });

        let language0 = self.blessed.radiobutton({
            parent: this.buttonContainer,
            top: 0,
            left: 0,
            width: 18,
            height: 3,
            style: {
                fg: 'white',
                focus: {
                    fg: 'light-green',
                },
            },
            content: "Čeština",
        });

        let language1 = self.blessed.radiobutton({
            parent: this.buttonContainer,
            top: 3,
            left: 0,
            width: 18,
            height: 3,
            style: {
                fg: 'white',
                focus: {
                    fg: 'light-green',
                },
            },
            content: "English",
        });

        let language2 = self.blessed.radiobutton({
            parent: this.buttonContainer,
            top: 6,
            left: 0,
            width: 18,
            height: 3,
            style: {
                fg: 'white',
                focus: {
                    fg: 'light-green',
                },
            },
            content: "Español",
        });
        
        let language3 = self.blessed.radiobutton({
            parent: this.buttonContainer,
            top: 9,
            left: 0,
            width: 18,
            height: 3,
            style: {
                fg: 'white',
                focus: {
                    fg: 'light-green',
                },
            },
            content: "Français",
        });

        let language4 = self.blessed.radiobutton({
            parent: this.buttonContainer,
            top: 12,
            left: 0,
            width: 18,
            height: 3,
            style: {
                fg: 'white',
                focus: {
                    fg: 'light-green',
                },
            },
            content: "Hrvatski",
        });
        
        let language5 = self.blessed.radiobutton({
            parent: this.buttonContainer,
            top: 0,
            left: 22,
            width: 18,
            height: 3,
            style: {
                fg: 'white',
                focus: {
                    fg: 'light-green',
                },
            },
            content: "Italiano",
        });
 
        let language6 = self.blessed.radiobutton({
            parent: this.buttonContainer,
            top: 3,
            left: 22,
            width: 18,
            height: 3,
            style: {
                fg: 'white',
                focus: {
                    fg: 'light-green',
                },
            },
            content: "Magyar",
        });

        let language7 = self.blessed.radiobutton({
            parent: this.buttonContainer,
            top: 6,
            left: 22,
            width: 18,
            height: 3,
            style: {
                fg: 'white',
                focus: {
                    fg: 'light-green',
                },
            },
            content: "Nederlands",
        });

        let language8 = self.blessed.radiobutton({
            parent: this.buttonContainer,
            top: 9,
            left: 22,
            width: 18,
            height: 3,
            style: {
                fg: 'white',
                focus: {
                    fg: 'light-green',
                },
            },
            content: "Polski",
        });
        
        let language9 = self.blessed.radiobutton({
            parent: this.buttonContainer,
            top: 12,
            left: 22,
            width: 18,
            height: 3,
            style: {
                fg: 'white',
                focus: {
                    fg: 'light-green',
                },
            },
            content: "Português",
        });

        let language10 = self.blessed.radiobutton({
            parent: this.buttonContainer,
            top: 0,
            left: 44,
            width: 18,
            height: 3,
            style: {
                fg: 'white',
                focus: {
                    fg: 'light-green',
                },
            },
            content: "Português (BR)",
        });
        
        let language11 = self.blessed.radiobutton({
            parent: this.buttonContainer,
            top: 3,
            left: 44,
            width: 18,
            height: 3,
            style: {
                fg: 'white',
                focus: {
                    fg: 'light-green',
                },
            },
            content: "Română",
        });
        
        let language12 = self.blessed.radiobutton({
            parent: this.buttonContainer,
            top: 6,
            left: 44,
            width: 18,
            height: 3,
            style: {
                fg: 'white',
                focus: {
                    fg: 'light-green',
                },
            },
            content: "Türkçe",
        });
        
        let language13 = self.blessed.radiobutton({
            parent: this.buttonContainer,
            top: 9,
            left: 44,
            width: 18,
            height: 3,
            style: {
                fg: 'white',
                focus: {
                    fg: 'light-green',
                },
            },
            content: "Ελληνική",
        });
        
        let language14= self.blessed.radiobutton({
            parent: this.buttonContainer,
            top: 12,
            left: 44,
            width: 18,
            height: 3,
            style: {
                fg: 'white',
                focus: {
                    fg: 'light-green',
                },
            },
            content: "Српски",
        });
        



        this.proceedButtonText = 'Continue';
    }

    before(langIndex) {
        this.buttonContainer.children[langIndex].check();
    }

    after() {
        let langIndex = null;

        this.buttonContainer.children.forEach(function(el, index){
            if (el.checked) langIndex = index;
        });

        return langIndex;
    }
}
module.exports = LanguageWindow;