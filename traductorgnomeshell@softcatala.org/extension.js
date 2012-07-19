
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

    let tasksMenu = this.menu;
    let buttonText = this.buttonText;

    // Separator
    this.Separator = new PopupMenu.PopupSeparatorMenuItem();
    this._combo = new PopupMenu.PopupComboBoxMenuItem({ style_class: 'status-chooser-combo' });
    
    //Langpairs
    let item;

    item = new LangPair("ca > es", 'user-available');
    this._combo.addMenuItem(item, 0);

    item = new LangPair("es > ca", 'user-invisible');
    this._combo.addMenuItem(item, 1);

    item = new LangPair("en > ca", 'user-away');
    this._combo.addMenuItem(item, 2);

    this._combo.connect('active-item-changed', Lang.bind(this, this._changeLangPair));

    this._combo.setActiveItem(0);
    tasksMenu.addMenuItem(this._combo);
    tasksMenu.addMenuItem(this.Separator);
    
    // Bottom section
    let bottomSection = new PopupMenu.PopupMenuSection();
    
    this.newTask = new St.Entry(
    {
      name: "newTaskEntry",
      hint_text: 'Nova entrada',
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
          var request = Soup.Message.new('GET', SCURL+'ca|es&q='+text1);
          _httpSession.queue_message(request, function(_httpSession, message) {

            if (message.status_code !== 200) {
              text1 = 'missatge no 200';
            }

            var translatedText = request.response_body.data;
            var translation = JSON.parse(translatedText);


            if (translation.responseData.translatedText)
              text1 = translation.responseData.translatedText;
            else
              text1 = 'No tira';

            showMessage(text1);
            _myNotify(text1);

           tasksMenu.close(); 
        });
      }
    });
    
    bottomSection.actor.add_actor(this.newTask);
    bottomSection.actor.add_style_class_name("newTaskSection");
    tasksMenu.addMenuItem(bottomSection);
  },

  _changeLangPair: function(menuItem, id) {
        showMessage(menuItem);
  },
  

  _translate: function()
  {
    
  },

  _selectPair: function()
  {
    this._visibilityItems('name', 'prova');
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

function _myNotify(text)
{
    global.log("_myNotify called: " + text);
 
    let source = new MessageTray.SystemNotificationSource();
    Main.messageTray.add(source);
    let notification = new MessageTray.Notification(source, text, null);
    notification.setTransient(true);
    source.notify(notification);
}

function showMessage(message)
{
  text = new St.Label({ style_class: 'helloworld-label', text: message });
  Main.uiGroup.add_actor(text);
  text.opacity = 255;

  let monitor = Main.layoutManager.primaryMonitor;

  text.set_position(Math.floor(monitor.width / 2 - text.width / 2),
                    Math.floor(monitor.height / 2 - text.height / 2));

  Tweener.addTween(text,
                   { opacity: 0,
                     time: 2,
                     transition: 'easeOutQuad',
                     onComplete: this._hideMessage });
}

// Init function
function init(metadata) 
{   
  return new TranslateText(metadata);
}
