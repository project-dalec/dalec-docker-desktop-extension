# Dalec Docker Extension

A Docker Desktop extension for building minimal container images using [Dalec](https://github.com/Azure/dalec) BuildKit frontend.

> [!WARNING]
> **Early Development**: This extension is not production ready yet and may change significantly.

## 🚀 Features

- **Minimal Image Builder**: Create optimized container images with only the packages you need
- **Real-time Build Logs**: Watch Docker/Dalec build output stream live
- **Quick Actions**: Run, inspect, or copy built images with one click
- **Enhanced Log Viewer**: Color-coded logs with auto-scroll and formatting
- **Success Feedback**: Visual confirmation with image details when builds complete
- **Multiple OS Targets**: Support for AzLinux3 and other Dalec-supported distributions

This extension is composed of:

- A [frontend](./ui) app in React with an intuitive UI for configuring and building images
- A [backend](./backend) service in Node.js that manages builds and Docker operations

> You can build your Docker Extension using your fav tech stack:
>
> - Frontend: React, Angular, Vue, Svelte, etc.
>   Basically, any frontend framework you can bundle in an `index.html` file with CSS, and JS assets.
> - Backend (optional): anything that can run in a container.

<details>
  <summary>Looking for more templates?</summary>

1. [React + NodeJS](https://github.com/benja-M-1/node-backend-extension).
2. [React + .NET 6 WebAPI](https://github.com/felipecruz91/dotnet-api-docker-extension).

Request one or submit yours [here](https://github.com/docker/extensions-sdk/issues).

</details>

## Local development

You can use `docker` to build, install and push your extension. Also, we provide an opinionated [Makefile](Makefile) that could be convenient for you. There isn't a strong preference of using one over the other, so just use the one you're most comfortable with.

To build the extension, use `make build-extension` **or**:

```shell
> docker --context desktop-linux build -t dalec-extension:local .
docker build -t dalec-extension:latest .
```

```shell
  docker buildx build -t dalec-extension:latest . --load
```

To install the extension, use `make install-extension` **or**:

```shell
  > docker extension install dalec-extension:latest
  docker extension install dalec-extension:latest
```

> If you want to automate this command, use the `-f` or `--force` flag to accept the warning message.

To preview the extension in Docker Desktop, open Docker Dashboard once the installation is complete. The left-hand menu displays a new tab with the name of your extension. You can also use `docker extension ls` to see that the extension has been installed successfully.

### Frontend development

During the development of the frontend part, it's helpful to use hot reloading to test your changes without rebuilding your entire extension. To do this, you can configure Docker Desktop to load your UI from a development server.
Assuming your app runs on the default port, start your UI app and then run:

```shell
  cd ui
  npm install
  npm run dev
```

This starts a development server that listens on port `3000`.

You can now tell Docker Desktop to use this as the frontend source. In another terminal run:

```shell
  docker extension dev ui-source my/awesome-extension:latest http://localhost:3000
```

In order to open the Chrome Dev Tools for your extension when you click on the extension tab, run:

```shell
  docker extension dev debug my/awesome-extension:latest
```

Each subsequent click on the extension tab will also open Chrome Dev Tools. To stop this behaviour, run:

```shell
  docker extension dev reset my/awesome-extension:latest
```

### Backend development (optional)

This example defines an API in Go that is deployed as a backend container when the extension is installed. This backend could be implemented in any language, as it runs inside a container. The extension frameworks provides connectivity from the extension UI to a socket that the backend has to connect to on the server side.

Note that an extension doesn't necessarily need a backend container, but in this example we include one for teaching purposes.

Whenever you make changes in the [backend](./backend) source code, you will need to compile them and re-deploy a new version of your backend container.
Use the `docker extension update` command to remove and re-install the extension automatically:

```shell
docker extension update my/awesome-extension:latest
```

> If you want to automate this command, use the `-f` or `--force` flag to accept the warning message.

> Extension containers are hidden from the Docker Dashboard by default. You can change this in Settings > Extensions > Show Docker Extensions system containers.

### Clean up

To remove the extension:

```shell
docker extension rm my/awesome-extension:latest
```

## 📚 Documentation

- **[ENHANCEMENTS.md](./ENHANCEMENTS.md)**: Detailed list of features and technical changes
- **[TESTING.md](./TESTING.md)**: Test scenarios and verification steps

## 🎯 Usage

1. **Select OS Target**: Choose your base operating system (e.g., azlinux3)
2. **Pick Packages**: Toggle packages to include (curl, bash, etc.)
3. **Name Your Image**: Set image name and tag
4. **Create Image**: Click to start the build
5. **Watch Progress**: Real-time logs show build stages
6. **Use Quick Actions**: Run, inspect, or copy the built image

## 🔧 Architecture

The extension uses:
- **Dalec BuildKit Frontend**: Creates minimal images with precise dependencies
- **Server-Sent Events (SSE)**: Streams build logs to the UI in real-time
- **Docker API**: Manages image operations (build, run, inspect)

## What's next?

- To learn more about Dalec visit https://github.com/Azure/dalec
- To learn more about Docker Extensions refer to https://docs.docker.com/desktop/extensions-sdk/
- To publish your extension in the Marketplace visit https://www.docker.com/products/extensions/submissions/
