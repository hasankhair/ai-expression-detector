export class Camera {
  constructor(video) { this.video = video; this.stream = null; }
  async start() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser does not support webcam access. Use a current version of Chrome, Edge, or Firefox over localhost or HTTPS.');
    this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    this.video.srcObject = this.stream; await this.video.play(); return this.stream;
  }
  stop() { this.stream?.getTracks().forEach(track => track.stop()); this.stream = null; this.video.srcObject = null; }
  get active() { return Boolean(this.stream?.active); }
}
