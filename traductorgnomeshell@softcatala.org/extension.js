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
const SCURL = 'http://www.softcatala.org/apertium/json/translate?markUnknown=yes&key='+apiKey+'&langpair=';
Soup.Session.prototype.add_feature.call(_httpSession, new Soup.ProxyResolverDefault());

var selectedLangPair = 'en|ca'; //Default langpair
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
    
    //Langpairs
    let item;

    item = new LangPair(_("English » Catalan"), 'user-away');
    this._combo.addMenuItem(item, 0);
    this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

    item = new LangPair(_("Catalan » English"), 'user-away');
    this._combo.addMenuItem(item, 1);
    this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

    item = new LangPair(_("Catalan » Spanish"), 'user-away');
    this._combo.addMenuItem(item, 2);
    this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

    item = new LangPair(_("Spanish » Catalan"), 'user-away');
    this._combo.addMenuItem(item, 3);
    this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

    item = new LangPair(_("Spanish » Catalan (Valencian)"), 'user-away');
    this._combo.addMenuItem(item, 4);
    this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

    item = new LangPair(_("French » Catalan"), 'user-away');
    this._combo.addMenuItem(item, 5);
    this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

    item = new LangPair(_("Catalan » French"), 'user-away');
    this._combo.addMenuItem(item, 6);
    this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

    item = new LangPair(_("Portuguese » Catalan"), 'user-away');
    this._combo.addMenuItem(item, 7);
    this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

    item = new LangPair(_("Catalan » Portuguese"), 'user-away');
    this._combo.addMenuItem(item, 8);
    this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

    this._combo.connect('active-item-changed', Lang.bind(this, this._changeLangPair));

    this._combo.setActiveItem(0);
    
    traductorMenu.addMenuItem(this._combo);
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
        let url = SCURL+selectedLangPair+'&q='+textToTranslate;
        global.log(selectedLangPair);
        var request = Soup.Message.new('GET', url);
        _httpSession.queue_message(request, function(_httpSession, message) {

          if (message.status_code !== 200) {
            textTranslated = _("Something went wrong (received status was not 200)");
          }

          var translatedText = request.response_body.data;
          var translation = JSON.parse(translatedText);


          if (translation.responseData.translatedText)
            textTranslated = translation.responseData.translatedText;
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
  

  _translate: function(){
    
  },

  _setLangPair: function(activeitem){
    let langpaircode;
    switch(activeitem)
    {
      case 0:
         langpaircode = 'ca|en';
        break;
      case 1:
        langpaircode = 'en|ca';
        break;
      case 2:
        langpaircode = 'ca|es';
        break;
      case 3:
        langpaircode = 'es|ca';
        break;
      case 4:
        langpaircode = 'es|ca_valencia';
        break;
      case 5:
        langpaircode = 'fr|ca';
        break;
      case 6:
        langpaircode = 'ca|fr';
        break;
      case 7:
        langpaircode = 'pt|ca';
        break;
      case 8:
        langpaircode = 'ca|pt';
        break;
    }

    selectedLangPair = langpaircode;
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
}

// Init function
function init(metadata){   
  return new TranslateText(metadata);
}
