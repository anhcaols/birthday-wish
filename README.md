# 🎂 Birthday Wish Animation

A beautiful 3D birthday wish animation using Three.js with falling romantic messages, photos, and background music.

![Birthday Animation Demo](./demo-screenshot.png)

## ✨ Features

- 🎨 **3D Animated Scene** - Messages, photos, and hearts falling like snow using Three.js
- 🖱️ **Mouse Interaction** - Move your mouse to create wind effects and 3D camera movement
- ❄️ **Snow-like Animation** - Objects fall naturally with swinging motion
- 🎵 **Background Music** - Auto-playing romantic music with volume control
- 💖 **Romantic Theme** - Pink gradient text with glowing effects
- 📱 **Responsive Design** - Works on all screen sizes
- ⭐ **Starry Background** - Animated stars in space-like environment
- 🖼️ **Custom Photos** - Add your own special moments
- 💝 **40+ Custom Messages** - Romantic birthday wishes

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Add Your Music
Place your birthday song as `public/music/birthday-song.mp3`

You can download royalty-free romantic music from:
- [YouTube Audio Library](https://www.youtube.com/audiolibrary)
- [Incompetech](https://incompetech.com/)
- [Free Music Archive](https://freemusicarchive.org/)

### 3. Add Your Photos (Optional)
1. Create folder: `public/images/`
2. Add your photos: `photo1.jpg`, `photo2.jpg`, etc.
3. Update `src/app/components/birthday/wishes.ts`:

```typescript
export const photos = [
  '/images/photo1.jpg',
  '/images/photo2.jpg',
  '/images/photo3.jpg',
];
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

### 5. Interact with the Animation
- **Move your mouse** around the screen to create wind effects
- Watch as the camera follows your mouse in 3D space
- Messages and images will drift based on your mouse movement

## 🎨 Customization

### Edit Birthday Messages
Edit `src/app/components/birthday/wishes.ts`:

```typescript
export const birthdayWishes = [
  { text: 'I love you ❤️', size: 56 },
  { text: 'You are my universe', size: 48 },
  // Add your own messages...
];
```

### Change Main Title
Edit `src/app/components/birthday/index.tsx` line 38:

```typescript
Happy Birthday! 🎂
```

### Adjust Animation Speed
In `BirthdayScene.tsx`, modify the velocity values:

```typescript
velocity: new THREE.Vector3(
  (Math.random() - 0.5) * 0.02,
  -0.05 - Math.random() * 0.05,  // Increase for faster falling
  (Math.random() - 0.5) * 0.02
),
```

### Change Colors
In `BirthdayScene.tsx`, modify the color values:

```typescript
const pointLight1 = new THREE.PointLight(0xff69b4, 1, 100); // Pink light
const pointLight2 = new THREE.PointLight(0xff1493, 1, 100); // Deep pink light
```

Color format: `0xRRGGBB` (hex)

## 📦 Project Structure

```
birthday-wish/
├── src/
│   └── app/
│       ├── components/
│       │   └── birthday/
│       │       ├── index.tsx          # Main component
│       │       ├── BirthdayScene.tsx  # Three.js 3D scene
│       │       ├── MusicPlayer.tsx    # Audio player
│       │       └── wishes.ts          # Messages & photos data
│       ├── page.tsx                   # Home page
│       └── globals.css                # Global styles
├── public/
│   ├── music/
│   │   └── birthday-song.mp3         # Your music file
│   └── images/                        # Your photos
└── package.json
```

## 🎵 Music Autoplay

Most browsers block autoplay with sound. Users may need to click the play button on first visit.

To ensure music plays:
1. User interacts with the page first (click anywhere)
2. Use the play button in bottom-right corner

## 🐛 Troubleshooting

### Music Not Playing
- ✅ Check file exists: `public/music/birthday-song.mp3`
- ✅ Try different format (MP3 recommended)
- ✅ Click the play button manually
- ✅ Check browser console for errors

### Images Not Loading
- ✅ Verify file paths in `wishes.ts`
- ✅ Check images are in `public/images/`
- ✅ Use supported formats: JPG, PNG, WEBP
- ✅ Compress large images (< 1MB recommended)

### Slow Performance
- ✅ Reduce number of messages in `wishes.ts`
- ✅ Compress/resize images
- ✅ Reduce particles in `BirthdayScene.tsx`

## 🔧 Technologies

- **React 19** - UI framework
- **Next.js 15** - React framework with Turbopack
- **Three.js** - 3D graphics library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling

## 📝 License

MIT License - Feel free to use for personal projects!

## 💖 Made With Love

Created for special birthday celebrations ✨

---

**Enjoy your birthday animation!** 🎂🎉💝
