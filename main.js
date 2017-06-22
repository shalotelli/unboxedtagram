const { 
  app,
  BrowserWindow,
  Menu,
  shell,
  dialog,
  ipcMain
} = require('electron');

const fs = require('fs');

let mainWindow;

const debug = /--debug/.test(process.argv[2]);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);
 
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  addApplicationMenu();

  if (debug) {
    mainWindow.webContents.openDevTools();
    require('devtron').install();
  }
}

function addApplicationMenu() {
  const name = app.getName();

  const template = [
    {
      label: name,
      submenu: [
        {
          label: `About ${name}`,
          role: 'about'
        },

        {
          type: 'separator'
        },

        {
          label: `Quit ${name}`,
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },

    {
      label: 'File',
      role: 'file',
      submenu: [
        {
          label: 'New Image',
          role: 'new',
          accelerator: 'CmdOrCtrl+N',
          click: (item, focusedWindow) => {
            focusedWindow.reload();
          }
        },

        {
          type: 'separator'
        },

        {
          label: 'Save',
          role: 'save',
          accelerator: 'CmdOrCtrl+S',
          click: (item, focusedWindow) => {
            focusedWindow.webContents.send('save::requestfile');
          }
        }
      ]
    },

    {
      label: 'Help',
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: () => {
            shell.openExternal('http://unboxedtechnology.com');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);

  Menu.setApplicationMenu(menu);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.on('save::noimage', () => {
  dialog.showMessageBox({
    type: 'error',
    title: 'Something went wrong!',
    message: 'You haven\'t selected an image!',
    buttons: [ 'Ok' ]
  });
});

ipcMain.on('save::getfile', (event, image) => {
  const options = {
    title: 'Save Image',
    filters: [
      { name: 'Images', extensions: [ 'png' ] }
    ]
  };

  dialog.showSaveDialog(options, path => {
    image = image.replace(/^data:image\/png;base64,/, '');
    fs.writeFile(path, image, 'base64', (err) => {
      if (err) {
        dialog.showMessageBox({
          type: 'error',
          title: 'Something went wrong!',
          message: err,
          buttons: [ 'Ok' ]
        });
      } else {
        event.sender.send('save::success', path);
      }
    });
  });
});