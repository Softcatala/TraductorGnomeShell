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

const apiKey = 'NzFkNTc4NTQ0OWI1MDY0ZTk3ZDF';
const apertiumKey = 'HXoGDcuXSAkpZuo8S/YbrsB9RA0';
const SCURL = 'http://www.softcatala.org/apertium/json/translate?markUnknown=yes&key='+apiKey+'&langpair=';
const SCAPERTIUM = 'http://api.apertium.org/json/translate?markUnknown=yes&key='+apertiumKey+'&langpair=';
Soup.Session.prototype.add_feature.call(_httpSession, new Soup.ProxyResolverDefault());

var languageFrom = 'en'; //Translate from English by default
var languageTo = 'ca'; //Translate to Catalan by default

let text, button;

// TranslateText function
function TranslateText(metadata)
{ 
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
TranslateText.prototype =
{
  __proto__: PanelMenu.Button.prototype,
  
  _init: function() 
  {     
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

    //Language to translate From
    item = new LangPair(_("English"), 'user-available');
    this._combo.addMenuItem(item, 0);
    this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

    item = new LangPair(_("Catalan"), 'user-available');
    this._combo.addMenuItem(item, 1);
    this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

    item = new LangPair(_("Spanish"), 'user-available');
    this._combo.addMenuItem(item, 2);
    this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

    item = new LangPair(_("French"), 'user-available');
    this._combo.addMenuItem(item, 3);
    this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

    item = new LangPair(_("Portuguese"), 'user-available');
    this._combo.addMenuItem(item, 4);
    this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

    //Language to translate To
    item = new LangPair(_("English"), 'user-away');
    this._comboTo.addMenuItem(item, 0);
    this._comboTo._itemActivated(item, Lang.bind(this, this._changeLangPairTo));

    item = new LangPair(_("Catalan"), 'user-away');
    this._comboTo.addMenuItem(item, 1);
    this._comboTo._itemActivated(item, Lang.bind(this, this._changeLangPairTo));

    item = new LangPair(_("Catalan (Valencian)"), 'user-away');
    this._comboTo.addMenuItem(item, 2);
    this._comboTo._itemActivated(item, Lang.bind(this, this._changeLangPairTo));

    item = new LangPair(_("Spanish"), 'user-away');
    this._comboTo.addMenuItem(item, 3);
    this._comboTo._itemActivated(item, Lang.bind(this, this._changeLangPairTo));

    item = new LangPair(_("French"), 'user-away');
    this._comboTo.addMenuItem(item, 4);
    this._comboTo._itemActivated(item, Lang.bind(this, this._changeLangPairTo));

    item = new LangPair(_("Portuguese"), 'user-away');
    this._comboTo.addMenuItem(item, 5);
    this._comboTo._itemActivated(item, Lang.bind(this, this._changeLangPairTo));

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
    entryText.connect('key-press-event', function(o,e){
      let symbol = e.get_key_symbol();
      if (symbol == Clutter.Return)
      {
        let  textToTranslate = o.get_text();

        /* Get the string and translate */
        //let url = SCURL+languageFrom+'|'+languageTo+'&q='+textToTranslate;
        let url = SCAPERTIUM+languageFrom+'|'+languageTo+'&q='+textToTranslate;
        
        var request = Soup.Message.new('GET', url);
        
        _httpSession.queue_message(request, function(_httpSession, message) {

          var serverresponse = request.response_body.data;
          var translation = JSON.parse(serverresponse);
          var status_code = translation.responseStatus;
          var response_details = translation.responseDetails;
          
          if (translation.responseData.translatedText && status_code == 200)
            textTranslated = translation.responseData.translatedText;
          else if (status_code != '200')
            textTranslated = response_details;
          else
            textTranslated = _("Something went wrong (probably the langpair was not properly selected)");

          showMessage(textTranslated);

          traductorMenu.close(); 
        });
      }
    });
    
    bottomSection.actor.add_actor(this.newText);
    bottomSection.actor.add_style_class_name("newTranslateSection");
    traductorMenu.addMenuItem(bottomSection);
  },

  _changeLangPair: function(item){
    //Retrieve the item position
    let activeitem = item._activeItemPos;
    this._setLangPair(activeitem);
  },

  _changeLangPairTo: function(item){
    //Retrieve the item position
    let activeitem = item._activeItemPos;
    this._setLangPairTo(activeitem);
  },
  

  _translate: function(){
    
  },

  _setLangPair: function(activeitem){
    let langpaircode;
    switch(activeitem){
      case 0:
        langpaircode = 'en';
        break;
      case 1:
        langpaircode = 'ca';
        break;
      case 2:
        langpaircode = 'es';
        break;
      case 3:
        langpaircode = 'fr';
        break;
      case 4:
        langpaircode = 'pt';
        break;
    }

    languageFrom = langpaircode;
  },

  _setLangPairTo: function(activeitem){
    let langpaircode;
    switch(activeitem){
      case 0:
         langpaircode = 'en';
        break;
      case 1:
        langpaircode = 'ca';
        break;
      case 2:
        langpaircode = 'ca_valencia';
        break;
      case 3:
        langpaircode = 'es';
        break;
      case 4:
        langpaircode = 'fr';
        break;
      case 5:
        langpaircode = 'pt';
        break;
    }

    languageTo = langpaircode;
  },


  _hideMessage: function(){
      Main.uiGroup.remove_actor(text);
      text = null;
  },
  
  enable: function(){
    Main.panel._rightBox.insert_child_at_index(this.actor, 0);
    Main.panel._menus.addMenu(this.menu);
  },

  disable: function(){
    Main.panel._menus.removeMenu(this.menu);
    Main.panel._rightBox.remove_actor(this.actor);
    this.monitor.cancel();
  }
}

function showMessage(text){ 
    let source = new MessageTray.SystemNotificationSource();
    Main.messageTray.add(source);
    let notification = new MessageTray.Notification(source, text, null);
    notification.setTransient(true);
    source.notify(notification);

    St.Clipboard.get_default().set_text(text);
}

// Init function
function init(metadata){   
  return new TranslateText(metadata);
}
