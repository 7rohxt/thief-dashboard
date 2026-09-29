import f1 from '../assets/faces/face-1.jpg'
import f2 from '../assets/faces/face-2.jpg'
import f3 from '../assets/faces/face-3.jpg'
import f4 from '../assets/faces/face-4.jpg'
import f5 from '../assets/faces/face-5.jpg'

// Placeholder portraits for the demo. In production these come from the
// department's own photo records, keyed by offender ID.
export const PHOTOS = [f1, f2, f3, f4, f5]
export const photoOf = (offender) => PHOTOS[offender.photo % PHOTOS.length]
