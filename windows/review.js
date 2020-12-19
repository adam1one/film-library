/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
             Review Window
------------------------------------------

Set unrecognised top-level directories and video files to ignore or delete
*/
class ReviewWindow {

    constructor() {
        var self = this;
        this.blessed = require('blessed');

        this.deletePaths = null;
        this.tableData = null;

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
            content: "Unrecognised Paths"
        });  

        this.subheading = this.blessed.text({
            parent: this.contentContainer,
            left: "center",
            top: 3,
            width: 70,
        });         

        this.table = this.blessed.listtable({
            parent: this.contentContainer,
            top: 6,
            bottom: 4,
            left: 4,
            right: 4,
            align: "left",
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                border: {
                    fg: 'white'
                },
                focus: {
                    border: {
                        fg: "green"
                    },
                    header: {
                        fg: "green"
                    }
                },
                header: {
                    bold: true,
                },
            },
            noCellBorders: true,
            selectedBg: 'light-black',
            keys: true,
            scrollable: true,
        });

        this.table.on('keypress', function(_, key){
            if (key.name != 'space') return;
                
            let tableIndex = self.table.selected;
            let scrollPoint = self.table.childBase;

            if (self.deletePaths[tableIndex - 1][0]) {
                self.deletePaths[tableIndex - 1][0] = false;
                self.tableData[tableIndex][0] = 'Ignore';
            }
            else {
                self.deletePaths[tableIndex - 1][0] = true;
                self.tableData[tableIndex][0] = 'Delete';    
            }

            self.table.setData(self.tableData);
            self.table.select(tableIndex);
            self.table.scrollTo(scrollPoint+self.table.height-3);
            self.contentContainer.screen.render();
        });

        this.initialFocus = this.table;
        this.proceedButtonText = 'Continue';
    }

    before(deletePaths) {
        var self = this;

        this.deletePaths = deletePaths;
        this.subheading.content = "These "+deletePaths.length+" top-level directories and video files were not recognised.  \nThey can be ignored or deleted. Press 'Space' to toggle action.";
        this.tableData = [['Action', 'Path']];

        deletePaths.forEach(function(arr){
            self.tableData.push(['Ignore', '/'+arr[1]]);
        });

        this.table.setData(this.tableData);
    }

    after() {
        return this.deletePaths;
    }
}
module.exports = ReviewWindow;