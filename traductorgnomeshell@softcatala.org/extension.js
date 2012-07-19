
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
Soup.Session.prototype.add_feature.call(_httpSession, new Soup.ProxyResolverDefault());

const SCURL = 'http://www.softcatala.org/apertium/json/translate?markUnknown=yes&key=NWI0MjQwMzQ2MzYyMzEzNjMyNjQ&langpair=';
var selectedLangPair = 'en|ca';

let text, button;

// TranslateText function
function TranslateText(metadata)
{ 
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
    this._selectedLangPair = 'ca|es';

    let tasksMenu = this.menu;
    let buttonText = this.buttonText;

    // Separator
    this.Separator = new PopupMenu.PopupSeparatorMenuItem();
    this._combo = new PopupMenu.PopupComboBoxMenuItem({ style_class: 'status-chooser-combo' });
    
    //Langpairs
    let item;

    item = new LangPair("en > ca", 'user-away');
    this._combo.addMenuItem(item, 0);
    this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

    item = new LangPair("ca > en", 'user-away');
    this._combo.addMenuItem(item, 1);
    this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

    item = new LangPair("ca > es", 'user-away');
    this._combo.addMenuItem(item, 2);
    this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

    item = new LangPair("es > ca", 'user-away');
    this._combo.addMenuItem(item, 3);
    this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

    item = new LangPair("fr > ca", 'user-away');
    this._combo.addMenuItem(item, 4);
    this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

    item = new LangPair("ca > fr", 'user-away');
    this._combo.addMenuItem(item, 5);
    this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

    item = new LangPair("pt > ca", 'user-away');
    this._combo.addMenuItem(item, 6);
    this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

    item = new LangPair("ca > pt", 'user-away');
    this._combo.addMenuItem(item, 7);
    this._combo._itemActivated(item, Lang.bind(this, this._changeLangPair));

    this._combo.connect('active-item-changed', Lang.bind(this, this._changeLangPair));

    this._combo.setActiveItem(0);
    
    tasksMenu.addMenuItem(this._combo);
    tasksMenu.addMenuItem(this.Separator);
    
    // Bottom section
    let bottomSection = new PopupMenu.PopupMenuSection();
    
    this.newTask = new St.Entry(
    {
      name: "textEntry",
      hint_text: 'Type the text to translate',
      track_hover: true,
      can_focus: true
    });

    let entryNewTask = this.newTask.clutter_text;
    entryNewTask.connect('key-press-event', function(o,e){
        let symbol = e.get_key_symbol();
        if (symbol == Clutter.Return)
        {
          text1 = o.get_text();

          /* Get the string and translate */
          let url = SCURL+selectedLangPair+'&q='+text1;
          global.log(selectedLangPair);
          var request = Soup.Message.new('GET', url);
          _httpSession.queue_message(request, function(_httpSession, message) {

            if (message.status_code !== 200) {
              text1 = 'Something went wrong (received status was not 200)';
            }

            var translatedText = request.response_body.data;
            var translation = JSON.parse(translatedText);


            if (translation.responseData.translatedText)
              text1 = translation.responseData.translatedText;
            else
              text1 = 'Something went wrong (probably the langpair was not properly selected)';

            showMessage(text1);

           tasksMenu.close(); 
        });
      }
    });
    
    bottomSection.actor.add_actor(this.newTask);
    bottomSection.actor.add_style_class_name("newTranslateSection");
    tasksMenu.addMenuItem(bottomSection);
  },

  _changeLangPair: function(item) {
    //Retrieve the item position
    let activeitem = item._activeItemPos;
    this._setLangPair(activeitem);
  },
  

  _translate: function()
  {
    
  },

  _setLangPair: function(activeitem)
  {
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
        langpaircode = 'fr|ca';
        break;
      case 5:
        langpaircode = 'ca|fr';
        break;
      case 6:
        langpaircode = 'pt|ca';
        break;
      case 7:
        langpaircode = 'ca|pt';
        break;
    }

    selectedLangPair = langpaircode;
  },

  _hideMessage: function() 
  {
      Main.uiGroup.remove_actor(text);
      text = null;
  },
  
  enable: function()
  {
    Main.panel._rightBox.insert_child_at_index(this.actor, 0);
    Main.panel._menus.addMenu(this.menu);
  },

  disable: function()
  {
    Main.panel._menus.removeMenu(this.menu);
    Main.panel._rightBox.remove_actor(this.actor);
    this.monitor.cancel();
  }
}

function showMessage(text)
{
    global.log("_myNotify called: " + text);
 
    let source = new MessageTray.SystemNotificationSource();
    Main.messageTray.add(source);
    let notification = new MessageTray.Notification(source, text, null);
    notification.setTransient(true);
    source.notify(notification);
}

// Init function
function init(metadata) 
{   
  return new TranslateText(metadata);
}
