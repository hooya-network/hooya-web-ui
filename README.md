hooya-web-ui
============

Web UI for operators on the [hooya
network](https://github.com/hooya-network/hooya). Provides a web frontend for
browsing, uploading, and managing media files stored in hooya instances. This is
where you log in and participate in the network.

This UI can also used for non-public (ie local) instances.

Longer discussion on what boorus are and on the HooYa vision is at
[wesl.ee/HooYa](https://wesl.ee/HooYa/).

Installation
------------

This repo has nix flakes to manage dependencies. You don't need to use it if
you have some other way of managing npm and friends.

```bash
git clone git@github.com:hooya-network/hooya-web-ui.git
cd hooya-web-ui
# if you are using nix
nix develop
npm install
```

Configuration
-------------

hooya-web-ui knows how to connect to
[hooya-web-proxy](https://github.com/hooya-network/hooya/tree/trunk/crates/hooya-web-proxy)
by way of an environment variable.

```bash
export HOOYA_WEB_PROXY_URL=http://localhost:8532
```

Ensure that hooya-web-proxy is listening on this address first, and will allow
CORS from this web-ui, like so:

```bash
./target/debug/hooya-web-proxy \
    --endpoint 192.168.17.226:8531 \          # remote address of hooyad
    --proxy-endpoint 192.168.17.226:8532 \    # listen address of hooya-web-proxy
    --cors-origins http://192.168.17.226:3000 # how you will access web-ui
```

If you fail to set CORS you may see CORS errors in the browser.

Running
-------

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at [localhost:3000](http://localhost:3000)

### Production

Build the application:

```bash
npm run build
npm run start
```

Or serve the static files with your preferred web server:

```bash
npm run build
# Serve the contents of the 'out' directory
```

Deploy
------

### Docker

Use the included Dockerfile:

```bash
docker build -t hooya-web-ui .
docker run -p 3000:3000 -e HOOYA_WEB_PROXY_URL=http://192.168.17.226:8532 hooya-web-ui
```

### systemd

A systemd service file is available in the main hooya repository at
[`/deploy/systemd/hooya-web-ui.service`](https://github.com/hooya-network/hooya/blob/trunk/deploy/systemd/hooya-web-ui.service).

See the [systemd deployment
guide](https://github.com/hooya-network/hooya/blob/trunk/deploy/systemd/README.md)
for complete setup instructions.

### Kubernetes

Kubernetes manifests are available in the main hooya repository at
[`/deploy/k8s/`](https://github.com/hooya-network/hooya/tree/trunk/deploy/k8s).

See the [Kubernetes deployment
guide](https://github.com/hooya-network/hooya/blob/trunk/deploy/k8s/README.md)
for complete setup instructions.

### Docker Compose

Docker Compose configuration is available in the main hooya repository at
[`/deploy/docker-compose/`](https://github.com/hooya-network/hooya/tree/trunk/deploy/docker-compose).

See the [Docker Compose deployment
guide](https://github.com/hooya-network/hooya/blob/trunk/deploy/docker-compose/README.md)
for complete setup instructions.

Dependencies
------------

The web UI requires:

- **[hooya-web-proxy](https://github.com/hooya-network/hooya/tree/trunk/crates/hooya-web-proxy)**
  running on port 8532 (or configured URL)
- **[hooyad](https://github.com/hooya-network/hooya/tree/trunk/crates/hooyad)**
  running and accessible to the web proxy

See the [main hooya repository](https://github.com/hooya-network/hooya) for
installation and setup instructions.

License
-------

MIT License (available in the source tree as /LICENSE)