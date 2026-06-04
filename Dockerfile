FROM openjdk:17-jdk-slim

RUN apt-get update && apt-get install -y \
    wget unzip nodejs npm python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

RUN wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip \
    && unzip commandlinetools-linux-9477386_latest.zip -d /android \
    && rm commandlinetools-linux-9477386_latest.zip

ENV ANDROID_HOME=/android
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/bin:$ANDROID_HOME/platform-tools

RUN yes | sdkmanager --sdk_root=$ANDROID_HOME "platforms;android-33" "build-tools;33.0.0"

RUN npm install -g @capacitor/cli

WORKDIR /app
COPY . .
RUN npm install

EXPOSE 3000
CMD ["node", "server.js"]
