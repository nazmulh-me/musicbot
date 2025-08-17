import path from "path";
import { nodewhisper } from "nodejs-whisper";

// Need to provide exact path to your audio file.
const filePath = path.resolve(__dirname, "./tts-jp.wav");

await nodewhisper(filePath, {
    modelName: "small", //Downloaded models name
    whisperOptions: {
        outputInCsv: false, // get output result in csv file
        outputInJson: false, // get output result in json file
        outputInJsonFull: false, // get output result in json file including more information
        outputInLrc: false, // get output result in lrc file
        outputInSrt: false, // get output result in srt file
        outputInText: true, // get output result in txt file
        outputInVtt: false, // get output result in vtt file
        outputInWords: false, // get output result in wts file for karaoke
        translateToEnglish: false, // translate from source language to english
        wordTimestamps: false, // word-level timestamps
        timestamps_length: 20, // amount of dialogue per timestamp pair
        splitOnWord: true, // split on word rather than on token
    },
});
