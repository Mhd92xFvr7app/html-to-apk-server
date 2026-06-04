FROM node:18-slim

RUN apt-get update && apt-get install -y \
    wget unzip zip openjdk-17-jdk \
    && rm -rf /var/lib/apt/lists/*

ENV ANDROID_HOME=/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

RUN wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip \
    && unzip -q commandlinetools-linux-9477386_latest.zip -d /tmp/cmdtools \
    && mkdir -p $ANDROID_HOME/cmdline-tools \
    && mv /tmp/cmdtools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest \
    && rm commandlinetools-linux-9477386_latest.zip

RUN yes | sdkmanager --sdk_root=$ANDROID_HOME "platforms;android-33" "build-tools;33.0.0" "platform-tools"

RUN npm install -g @capacitor/cli

WORKDIR /app
COPY . .
RUN npm install

EXPOSE 3000
CMD ["node", "server.js"]
