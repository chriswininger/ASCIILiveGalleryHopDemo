module.exports = {
    pad: function (str) {
        var pad = "00";
        return pad.substring(0, pad.length - str.length) + str;
    }
};