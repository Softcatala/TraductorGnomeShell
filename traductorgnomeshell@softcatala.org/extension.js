const St = imports.gi.St;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const Lang = imports.lang;
const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Shell = imports.gi.Shell;
const Tweener = imports.ui.tweener;
const Soup = imports.gi.Soup;
const _httpSession = new Soup.SessionAsync();

const Gettext = imports.gettext;
const _ = Gettext.domain('traductorgnomeshell').gettext;

Soup.Session.prototype.add_feature.call(_httpSession, new Soup.ProxyResolverDefault());

const GOOGLEURL = 'http://translate.google.com/translate_a/t?client=j&ie=UTF-8&oe=UTF-8';
const SENTENCES_REGEXP = /\n|([^\r\n.!?]+([.!?]+|\n|$))/gim;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Languages = Me.imports.languages;
const Utils = Me.imports.utils;


var languageFrom = 'en'; //Translate from English by default
var languageTo = 'ca'; //Translate to Catalan by default
let textTranslated

let text, button;
let todo, meta;

// TranslateText function
function TranslateText(metadata) { 
  let locales = metadata.path + "/locale";
  Gettext.bindtextdomain('traductorgnomeshell', locales);

  this._init();
}

//Language Pairs
function LangPair(label, iconName) {
    this._init(label, iconName);
}

LangPair.prototype = {
    __proto__: PopupMenu.PopupBaseMenuItem.prototype,

    _init: function(label, iconName) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this);

        this.actor.add_style_class_name('status-chooser-status-item');

        this._icon = new St.Icon({ style_class: 'popup-menu-icon' });
        this.addActor(this._icon);

        if (iconName)
            this._icon.icon_name = iconName;

        this.label = new St.Label({ text: label });
        this.addActor(this.label);
    }
};

// TranslateText main class
TranslateText.prototype = {
  __proto__: PanelMenu.Button.prototype,
  
  _init: function() {     
    PanelMenu.Button.prototype._init.call(this, St.Align.START);

    this.buttonText = new St.Label({text:'T'});
    this.buttonText.set_style("text-align:center;");
    this.actor.add_actor(this.buttonText);
    this.buttonText.get_parent().add_style_class_name("panelButtonWidth");

    let traductorMenu = this.menu;
    let buttonText = this.buttonText;

    // Separator
    this.Separator = new PopupMenu.PopupSeparatorMenuItem();
    this._combo = new PopupMenu.PopupComboBoxMenuItem({ style_class: 'status-chooser-combo' });
    this._comboTo = new PopupMenu.PopupComboBoxMenuItem({ style_class: 'status-chooser-combo' });
    
    //Langpairs
    let item;

    //var available_languages = new Array("English","Catalan", "Catalan (Valencian)","Spanish","Portuguese","Galician");

    var available_languages = Languages.getLanguages();

    let i = 0;
    //for(i = 0; i < available_languages.length; i++) {
    for (lang in available_languages) {

      //Language to translate From
      item = new LangPair(_(available_languages[lang]), 'user-available');
      this._combo.addMenuItem(item, i);
      this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

      //Language to translate To
      item = new LangPair(_(available_languages[lang]), 'user-away');
      this._comboTo.addMenuItem(item, i);
      this._comboTo._itemActivated(item, Lang.bind(this, this._changeLangPairTo));
      i++;
    }

    this._combo.connect('active-item-changed', Lang.bind(this, this._changeLangPair));
    this._comboTo.connect('active-item-changed', Lang.bind(this, this._changeLangPairTo));

    this._combo.setActiveItem(0);
    this._comboTo.setActiveItem(1);
    
    traductorMenu.addMenuItem(this._combo);
    traductorMenu.addMenuItem(this._comboTo);
    traductorMenu.addMenuItem(this.Separator);
    
    // Bottom section
    let bottomSection = new PopupMenu.PopupMenuSection();
    
    this.newText = new St.Entry({
      name: "textEntry",
      hint_text: _("Type the text to translate"),
      track_hover: true,
      can_focus: true
    });

    let entryText = this.newText.clutter_text;
    entryText.connect('key-press-event', function(o,e) {
      let symbol = e.get_key_symbol();
      if (symbol == Clutter.Return) {
        let  textToTranslate = o.get_text();

        /* Get the string and translate */

        translateAction(textToTranslate, languageFrom, languageTo);
      }
    });
    
    bottomSection.actor.add_actor(this.newText);
    bottomSection.actor.add_style_class_name("newTranslateSection");
    traductorMenu.addMenuItem(bottomSection);
  },

  _changeLangPair: function(item) {
    //Retrieve the item position
    let activeitem = item._activeItemPos;
    this._setLangPair(activeitem);
  },

  _changeLangPairTo: function(item) {
    //Retrieve the item position
    let activeitem = item._activeItemPos;
    this._setLangPairTo(activeitem);
  },

  _setLangPair: function(activeitem) {
    let langpaircode;
    langpaircode = Languages.getLangCode(activeitem);
    languageFrom = langpaircode;
  },

  _setLangPairTo: function(activeitem) {
    let langpaircode;
    langpaircode = Languages.getLangCode(activeitem);
    languageTo = langpaircode;
  },


  _hideMessage: function() {
      Main.uiGroup.remove_actor(text);
      text = null;
  },
  
  _enable: function() {
  },

  _disable: function() {
    this.monitor.cancel();
  }
}

function showMessage(text) { 
    let source = new MessageTray.SystemNotificationSource();
    Main.messageTray.add(source);
    let notification = new MessageTray.Notification(source, text, null);
    notification.setTransient(true);
    source.notify(notification);

    //St.Clipboard.get_default().set_text(text);
}

function parse_response(response_data) {
        let json;
        let result = '';

        try {
            json = JSON.parse(response_data);
        }
        catch(e) {
            log('%s Error: %s'.format(
                this.name,
                JSON.stringify(e, null, '\t')+"\nResponse_data:\n"+response_data
            ));
            return {
                error: true,
                message: "Can't translate text, please try later."
            };
        }

        if(json.dict != undefined) {
            result = this._markup_dict(json.dict);
            result = '%s\n\n%s'.format(json.sentences[0].trans, result);
        }
        else {
            for(let i = 0; i < json.sentences.length; i++) {
                result += json.sentences[i].trans;
            }
            result = Utils.escape_html(result);
        }

        return result;
    }

function translateAction(textToTranslate, languageFrom, languageTo){
  //let url = SCURL+languageFrom+'|'+languageTo+'&q='+textToTranslate;
  //let url = SCAPERTIUM+languageFrom+'|'+languageTo+'&q='+textToTranslate;
  let url = GOOGLEURL + '&sl=' + languageFrom + '&tl=' + languageTo + '&text=' + textToTranslate;
  
  var request = Soup.Message.new('GET', url);
  
  _httpSession.queue_message(request, function(_httpSession, message) {

    var serverresponse = request.response_body.data;

    textTranslated = parse_response(serverresponse);

    showMessage(textTranslated);
  });
}

// Init function
function init(metadata){ 
  meta = metadata;
}

function enable(){
  todo = new TranslateText(meta);
  todo._enable();
  Main.panel.addToStatusArea('T', todo);
}

function disable(){
  todo._disable();
  todo.destroy();
  todo = null;
}

