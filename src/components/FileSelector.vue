<template>
  <label class="file-select">
    <div class="select-button">
      <span v-if="value">Selected File: {{ value.name }}</span>
      <span v-else>Select File</span>
    </div>
    <input type="file" @change="handleFileChange" />
    <br>
    <label for="downloadAudio"> Download Audio</label>&nbsp;
    <input type="checkbox" v-model="downloadAudio" name="downloadAudio"/>
    <br>
    <p>{{ transcriptBoard }}</p>
  </label>
</template>

<script>
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'
import { saveAs } from 'file-saver'
import axios from 'axios'
export default {
  props: {
    val: {
      type: File,
      required: false
    }
  },
  data(props) {
    return {
      value: props.val,
      downloadAudio: false,
      fileName: "",
      operationName: "",
      transcriptBoard: "",
      token: "ya29.a0AbVbY6NES90yqI8XjaXxIxC01NBEc7fXiMiCTT-roEMMfL8OLlFG7A8HSmCKv1_1ozjpTA9TGit19mLlp-JsDpK0RZr7jX0w4kCwehG46cLH5mBuVSBmYDrmZ71De8xw00nnlLD1hHM5TgFlW8UV_945HGhs1V1RaCgYKAfESARASFQFWKvPlfU1JBSjoHooB-5Sh-m-MCw0167"
    }
  },
  methods: {
    async handleFileChange(e) {
      this.value = e.target.files[0]
      const fName = this.value.name.split('.')[0]
      this.fileName = fName +'-'+ Number(new Date()).toString() + '.mp3'
      this.$emit('input', e.target.files[0])

      this.ffmpeg.FS('writeFile', fName, await fetchFile(e.target.files[0]))

      await this.ffmpeg.run('-i', fName, 'test.mp3')
      const data = this.ffmpeg.FS('readFile', 'test.mp3')
      console.log('Complete transcoding')

      // download audio
      if (this.downloadAudio) {
        let audioFile = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mpeg' }))
        let newName = this.value.name.split('.')
        saveAs(audioFile, `${newName[0]}.mp3`)
      }

      // upload to bucket
      this.uploadToGcBucket(new Blob([data.buffer]))
    },
    uploadToGcBucket(bolb) {
      // upload to bucket
      const audionewFile = new File([bolb], `${this.fileName}`, {
        type: 'audio/mpeg'
      })
      var formData = new FormData()
      formData.append('file', audionewFile)
      axios
        .post(
          `https://storage.googleapis.com/upload/storage/v1/b/poc-transcribe-audio-bucket/o?uploadType=media&name=${this.fileName}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${this.token}`,
            }
          }
        )
        .then((response) => {
          console.log(response, 'upload successful')
          this.initiateTranscriptGeneration()
        })
        .catch((error) => {
          console.log('ERROR:' + error)
        })
    },
    initiateTranscriptGeneration() {
      const encoding = 'WEBM_OPUS'
      const sampleRateHertz = 48000
      const languageCode = 'en-US'
      const model = 'video'

      const config = {
        sampleRateHertz: sampleRateHertz,
        languageCode: languageCode,
        model: model,
        encoding: encoding
      }

      const audio = {
        uri: `gs://poc-transcribe-audio-bucket/${this.fileName}`
      }

      const request = {
        config: config,
        audio: audio
      }

      const configHeader = {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'x-goog-user-project': 'mineral-name-392217'
        }
      }

      axios
        .post(`https://speech.googleapis.com/v1/speech:longrunningrecognize`, request, configHeader)
        .then(async (response) => {
          console.log(response.data.name)
          this.operationName = response.data.name
          this.transcriptBoard = 'waiting 30 secs to initiate transcript generation'
          // wait 30 seconds
          // await setTimeout(30000, 'resolved')
          // console.log('30 secs wait completed')
          // this.getTranscript(response.data.name)
          setTimeout(this.getTranscript, 30000)
        })
        .catch((error) => {
          console.log('ERROR:' + error)
        })
    },
    getTranscript() {
      // this name will be used to make another api call to operations after about 30 seconds to fetch the transcript
      // https://speech.googleapis.com/v1/operations/:name

      console.log('generate transcript begins')
      this.transcriptBoard = "Generating transcript..."

      const configHeader = {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'x-goog-user-project': 'mineral-name-392217'
        }
      }

      axios
        .get(`https://speech.googleapis.com/v1/operations/${this.operationName}`, configHeader)
        .then((response) => {
          const transcription = response.data.response.results
            .map((result) => result.alternatives[0].transcript)
            .join('\n');
            this.transcriptBoard = transcription;
        })
        .catch((error) => {
          console.log('ERROR:' + error)
        })
    }
  },
  async setup() {
    const ffmpeg = createFFmpeg({
      log: false
    })
    await ffmpeg.load()
    return {
      ffmpeg
    }
  }
}
</script>

<style scoped>
.file-select > .select-button {
  padding: 1rem;

  color: white;
  background-color: #2ea169;

  border-radius: 0.3rem;

  text-align: center;
  font-weight: bold;
}

.file-select > input[type='file'] {
  display: none;
}
</style>
