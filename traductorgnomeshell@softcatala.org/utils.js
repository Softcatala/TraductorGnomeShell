const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gettext = imports.gettext;

function escape_html(unsafe){
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}