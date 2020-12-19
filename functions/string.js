/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
            String Functions
------------------------------------------

Some useful string functions.
*/
class String {
    clean(name) {
        return name.normalize("NFD").replace(/\?|:|[\u0300-\u036f]/g, "").replace(/\/|\*/g, " ");
    }

    search(haystack, needle) {
        return haystack.toLowerCase().indexOf(needle.toLowerCase()) == -1 ? false : true;
    }

    prefix(haystack, needle) {
        return haystack.toLowerCase().substr(0, needle.length) == needle.toLowerCase() ? true : false;
    }

    suffix(haystack, needle) {
        return haystack.toLowerCase().substr(haystack.length - needle.length, needle.length) == needle.toLowerCase() ? true : false;
    }
}
module.exports = String;