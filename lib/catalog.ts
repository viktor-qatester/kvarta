export const products = [
  {
    id: "ethiopia",
    name: "Эфиопия Иргачеффе",
    notes: "Цветочный, бергамот · светлая обжарка",
    pack: "250 г",
    price: "32 BYN",
  },
  {
    id: "colombia",
    name: "Колумбия Уила",
    notes: "Карамель, красное яблоко",
    pack: "250 г",
    price: "29 BYN",
  },
  {
    id: "brazil",
    name: "Бразилия Серрадо",
    notes: "Орех, шоколад · под эспрессо",
    pack: "250 г",
    price: "26 BYN",
  },
  {
    id: "drip",
    name: "Дрип-пакеты",
    notes: "Ассорти",
    pack: "10 шт.",
    price: "18 BYN",
  },
] as const;

export const subscription = {
  title: "Кофе каждый месяц",
  details: "2 пачки по 250 г · доставка бесплатно",
  price: "54 BYN/мес.",
} as const;
