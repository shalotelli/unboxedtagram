const ipc = require('electron').ipcRenderer;

class Dropzone {
  constructor(el) {
    this.el = document.querySelector(el);
    this.dropArea = this.el.querySelector('.drop-area');
    this.mainImage = this.el.querySelector('.main-image');
    this.thumbnails = this.el.querySelector('.thumbnails');

    this.acceptedFileTypes = [ 'image/png', 'image/jpeg' ];
    this.filters = [ 'sunrise', 'jarques', 'pinhole', 'grungy' ];
    this.filename = '';

    this.registerEventListeners();
    this.registerIpcListeners();
  }

  enableDropArea() {
    this.dropArea.classList.remove('hide');
    this.mainImage.classList.add('hide');
    this.thumbnails.classList.add('hide');
  }

  disableDropArea() {
    this.dropArea.classList.add('hide');
    this.mainImage.classList.remove('hide');
    this.thumbnails.classList.remove('hide');
  }

  onDrag(e) {
    e.preventDefault();
  }

  onDrop(e) {
    e.preventDefault();

    let files = e.dataTransfer.files;

    Object.keys(files).forEach(key => {
      if (~this.acceptedFileTypes.indexOf(files[key].type)) {
        this.filename = files[key].path;

        this.loadImage()
          .then(() => this.loadThumbnails())
          .then(() => this.disableDropArea())
          .catch(err => {
            console.log(err);
          });
      } else {
        console.log('File must be a png or jpeg image!');
      }
    });
  }

  loadImage() {
    return new Promise((resolve, reject) => {
      Caman(this.mainImage, this.filename, function() {
        this.render();
      });

      resolve();
    });
  }

  loadThumbnails() {
    return new Promise((resolve, reject) => {
      this.thumbnails.innerHTML = '';

      this.filters.forEach(filter => {
        let thumbnail = document.createElement('canvas');

        thumbnail.classList.add('thumbnail');
        thumbnail.setAttribute('filter', filter);
        thumbnail.addEventListener('click', this.onThumbnailClick.bind(this));

        this.thumbnails.appendChild(thumbnail);

        Caman(thumbnail, this.filename, function() {
          this[filter]().render();
        });
      });

      resolve();
    });
  }

  onThumbnailClick(e) {
    const thumbnail = e.target;
    const filter = thumbnail.getAttribute('filter');

    Caman(this.mainImage, function() {
      this.revert();
      this[filter]();
      this.render();
    });

    document.querySelectorAll('.thumbnail').forEach(thumbnail => {
      const action = thumbnail.getAttribute('filter') === filter ? 'add' : 'remove';
      thumbnail.classList[action]('selected');
    });
  }

  registerEventListeners() {
    this.dropArea.addEventListener('dragover', this.onDrag.bind(this));
    this.dropArea.addEventListener('drop', this.onDrop.bind(this));
  }

  registerIpcListeners() {
    ipc.on('save::requestfile', () => {
      if (this.mainImage.classList.contains('hide')) {
        ipc.send('save::noimage');
      } else {
        const image = this.mainImage.toDataURL('image/png');
        ipc.send('save::getfile', image);
      }
    });

    ipc.on('save::success', (event, path) => {
      const notification = {
        title: 'Success!',
        body: `${path} saved successfully!`,
        icon: path
      };
      
      new window.Notification(notification.title, notification);
    });
  }
}

const dropzone = new Dropzone('.dropzone');