TraductorGnomeShell
===================

This is a gnome-shell extension that let users enter a text, select the language pair for the translation and translate the text.

At this moment, language pairs available are:

* en ⇆ ca
* en ⇆ es
* fr ⇆ ca
* fr ⇆ es
* es ⇆ ca (and es » ca_valencia)
* es ⇆ pt
* pt ⇆ ca

This extension uses the Softcatalà translator to retrieve the translations (www.softcatala.org/traductor).

Softcatalà translator uses the "Apertium" technology (www.apertium.org).

INSTALL

1. Download the main folder (traductorgnomeshell@softcatala.org)
2. Place it on your /home/user/.local/share/gnome-shell/extensions folder
3. Open gnome-tweak-tool, go to the "Extensions" tab and enable the "Traductor Gnome-Shell" extension


TODO

* (in progress) Clean and restructure code
* (done) Copy the translated text to the clipboard
* (in progress) Add new langpairs (note that this depends on the server that is being used)
* Let the user select which translation service to use (apertium, softcatalà, google)