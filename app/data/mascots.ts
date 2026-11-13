export type MascotId = 'kiko' | 'mimi' | 'kuro' | 'momo'
export type MascotMood = 'idle' | 'typing' | 'focused' | 'overwhelmed' | 'sleepy' | 'laughing' | 'oops' | 'angry' | 'sideeye' | 'unbothered'
interface MascotProfile {
  name: string; personality: string; fur: string; paw: string; muzzle: string
  focusAt: number; overwhelmedAt: number; sleepAfter: number; laughEvery: number
  mistakeMood: MascotMood; idleDuration: number; tapDuration: number
  eyes: { x: number; y: number; color: string }[]
  lines: Record<MascotMood, string>
}
export const mascotIds: MascotId[] = ['kiko', 'mimi', 'kuro', 'momo']
export const mascots: Record<MascotId, MascotProfile> = {
  kiko: {
    name: 'Kiko', personality: 'Kompetitif · gampang sewot', fur: '#00c9bd', paw: '#fff0cb', muzzle: '#fff0cb',
    focusAt: 12, overwhelmedAt: 22, sleepAfter: 5000, laughEvery: 20, mistakeMood: 'angry', idleDuration: 3, tapDuration: 150,
    eyes: [{ x: 87, y: 80, color: '#00c9bd' }, { x: 152, y: 86, color: '#00c9bd' }],
    lines: { idle: 'Ayo, pecahin rekornya!', typing: 'Gas, gas, gas!', focused: 'Jangan ganggu. Lagi fokus!', overwhelmed: 'WAAH, ngebut banget!', sleepy: 'Lho, kok berhenti? Balapan, yuk!', laughing: 'HAHA! Gitu dong!', oops: 'Ayo coba lagi!', angry: 'Grr! Tombolnya ngajak ribut!', sideeye: 'Hmm?!', unbothered: 'Lanjut, yuk!' }
  },
  mimi: {
    name: 'Mimi', personality: 'Santai · suportif', fur: '#ffad54', paw: '#fff0cb', muzzle: '#fff3e4',
    focusAt: 16, overwhelmedAt: 30, sleepAfter: 7000, laughEvery: 24, mistakeMood: 'oops', idleDuration: 5.5, tapDuration: 220,
    eyes: [{ x: 86, y: 66, color: '#ffad54' }, { x: 151, y: 71, color: '#fff3e4' }],
    lines: { idle: 'Santai, nikmatin ritmenya~', typing: 'Pelan atau cepat, aku temenin.', focused: 'Nah, sudah ketemu ritmenya.', overwhelmed: 'Wuih… aku ketinggalan, hehe.', sleepy: 'Rehat bentar juga boleh~', laughing: 'Hehe, enak ya kalau lancar.', oops: 'Gapapa, hapus lalu coba lagi~', angry: 'Tarik napas dulu~', sideeye: 'Hmm, coba lagi yuk.', unbothered: 'Santai aja~' }
  },
  kuro: {
    name: 'Kuro', personality: 'Sinis · perfeksionis', fur: '#30323c', paw: '#474957', muzzle: '#30323c',
    focusAt: 14, overwhelmedAt: 26, sleepAfter: 9000, laughEvery: 24, mistakeMood: 'sideeye', idleDuration: 7, tapDuration: 170,
    eyes: [{ x: 86, y: 82, color: '#30323c' }, { x: 153, y: 88, color: '#30323c' }],
    lines: { idle: 'Aku mengamati. Silakan.', typing: 'Hmm. Masih kuperhatikan.', focused: 'Akhirnya, ritme yang rapi.', overwhelmed: 'Aku tidak panik. Keyboardnya iya.', sleepy: 'Bangunkan kalau sudah siap.', laughing: 'Hmph. Lumayan. Jangan ge-er.', oops: 'Menarik…', angry: 'Keyboard ini perlu evaluasi.', sideeye: 'Itu… pilihan tombol yang berani.', unbothered: 'Terserah. Aku mengawasi.' }
  },
  momo: {
    name: 'Momo', personality: 'Cuek · gampang bengong', fur: '#faf4e9', paw: '#fffaf2', muzzle: '#faf4e9',
    focusAt: 20, overwhelmedAt: 36, sleepAfter: 3500, laughEvery: 32, mistakeMood: 'unbothered', idleDuration: 8, tapDuration: 260,
    eyes: [{ x: 86, y: 82, color: '#faf4e9' }, { x: 153, y: 88, color: '#faf4e9' }],
    lines: { idle: '…oh. Udah mulai?', typing: 'Iya, iya. Aku ikut.', focused: 'Oh. Ternyata kita lagi serius.', overwhelmed: 'Hah? Tadi tangannya ada berapa?', sleepy: 'Zzz… aku nyimak kok.', laughing: 'Heh. Lucu juga tombolnya.', oops: 'Oh.', angry: '…ya sudah.', sideeye: 'Hmm?', unbothered: 'Salah? Oh. Ya udah, ketik lagi.' }
  }
}
export function pickMascot(random = Math.random): MascotId {
  return mascotIds[Math.min(mascotIds.length - 1, Math.max(0, Math.floor(random() * mascotIds.length)))]!
}
export function typingMood(id: MascotId, count: number, streak: number, mistake: boolean): MascotMood {
  const profile = mascots[id]
  if (count >= profile.overwhelmedAt) return 'overwhelmed'
  if (count >= profile.focusAt) return 'focused'
  if (streak > 0 && streak % profile.laughEvery === 0) return 'laughing'
  return mistake ? profile.mistakeMood : 'typing'
}
