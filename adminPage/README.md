# Notes:
This is still a bit of a work in progress and has fallen to the way side a little bit for the time being

# Installation:

```
sudo apt-get update; sudo apt-get install make build-essential libssl-dev zlib1g-dev
libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm
libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev
```

**REQUIRES PYTHON 2**

At least for now D:

`npm config set legacy-peer-deps true`

I ran with nodejs 14 to try and make sure things were compatable

change /src/variables/publicFetch

.env file:
```
APP_URL=
CAPTCHA_SITE_KEY=
HOME_URL=
REACT_APP_BACKEND_URL=
```