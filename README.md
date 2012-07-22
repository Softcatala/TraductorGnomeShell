TraductorGnomeShell
===================

This is a gnome-shell extension that let users enter a text, select the language pair for the translation and translate the text.

At this moment, language pairs available are:

* en - ca
* fr - ca
* es - ca
* pt - ca

This extension uses the Softcatalà translator to retrieve the translations (www.softcatala.org/traductor).

Softcatalà translator uses the "Apertium" technology (www.apertium.org).

INSTALL

1. Download the main folder (traductorgnomeshell@softcatala.org)
2. Place it on your /home/user/.local/share/gnome-shell/extensions folder
3. Open gnome-tweak-tool, go to the "Extensions" tab and enable the "Traductor Gnome-Shell" extension


TODO

* (done) Rename the language pairs to something more... human readable.
* (in progress) Clean and restructure code
* Copy the translated text to the clipboard
* Add new langpairs (note that this depend on the server that is being used)
* (done) Add translations to the interface (there are no too many strings, but it'd be nice)
* Let the user select which translation service to use (apertium, softcatalà, google)