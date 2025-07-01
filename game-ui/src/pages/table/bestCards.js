export function getBestCards(cards) {
  if (!Array.isArray(cards) || cards.length < 5) {
    throw new Error('At least 5 cards are required.');
  }

  const result = rankHand(cards);
  return result;
}
const rankOrder = "23456789TJQKA";

function cardValue(card) {
  return rankOrder.indexOf(card[0]);
}

function groupByRank(cards) {
  const groups = {};
  for (const c of cards) {
    const r = c[0];
    if (!groups[r]) groups[r] = [];
    groups[r].push(c);
  }
  return Object.values(groups).sort((a, b) =>
    b.length - a.length || cardValue(b[0]) - cardValue(a[0])
  );
}

function getStraight(cards) {
  const uniqueRanks = [...new Set(cards.map(c => cardValue(c)))].sort((a,b)=>b-a);
  if (uniqueRanks[0]===12) uniqueRanks.push(-1); // Ace low
  for(let i=0; i<=uniqueRanks.length-5; i++) {
    const slice = uniqueRanks.slice(i,i+5);
    if(slice[0]-slice[4]===4) {
      const rankSet = new Set(slice);
      return cards.filter(c => rankSet.has(cardValue(c)))
        .sort((a,b)=>cardValue(b)-cardValue(a));
    }
  }
  return null;
}

function getFlush(cards) {
  const suits={};
  for(const c of cards){
    const s=c[1];
    if(!suits[s]) suits[s]=[];
    suits[s].push(c);
  }
  for(const s in suits){
    if(suits[s].length>=5){
      return suits[s].sort((a,b)=>cardValue(b)-cardValue(a));
    }
  }
  return null;
}

function getStraightFlush(cards){
  const suits={};
  for(const c of cards){
    const s=c[1];
    if(!suits[s]) suits[s]=[];
    suits[s].push(c);
  }
  for(const s in suits){
    if(suits[s].length>=5){
      const straight=getStraight(suits[s]);
      if(straight) return straight;
    }
  }
  return null;
}

function rankHand(cards) {
  if(cards.length<5) throw new Error("At least 5 cards required");

  const straightFlush=getStraightFlush(cards);
  if(straightFlush){
    const high=cardValue(straightFlush[0]);
    const rank=high===12?9:8;
    const msg=high===12?"Royal Flush":"Straight Flush";
    return {rank, message:msg, combination:straightFlush.slice(0,5)};
  }

  const groups=groupByRank(cards);
  if(groups[0].length===4){
    const kicker=groups[1].sort((a,b)=>cardValue(b)-cardValue(a))[0];
    return {rank:7,message:"Four of a Kind",combination:[...groups[0]], kicker};
  }

  if(groups[0].length===3 && groups[1].length>=2){
    return {rank:6,message:"Full House",combination:[...groups[0],...groups[1].slice(0,2)]};
  }

  const flush=getFlush(cards);
  if(flush){
    return {rank:5,message:"Flush",combination:flush.slice(0,5)};
  }

  const straight=getStraight(cards);
  if(straight){
    return {rank:4,message:"Straight",combination:straight.slice(0,5)};
  }

  if(groups[0].length===3){
    const kicker=groups.slice(1).flat().sort((a,b)=>cardValue(b)-cardValue(a))[0];
    return {rank:3,message:"Three of a Kind",combination:[...groups[0]], kicker};
  }

  if(groups[0].length===2 && groups[1].length===2){
    const kicker=groups.slice(2).flat().sort((a,b)=>cardValue(b)-cardValue(a))[0];
    return {rank:2,message:"Two Pair",combination:[...groups[0],...groups[1]], kicker };
  }

  if(groups[0].length===2){
    const kicker=groups.slice(1).flat().sort((a,b)=>cardValue(b)-cardValue(a))[0];
    return {rank:1,message:"One Pair",combination:[...groups[0]], kicker};
  }

  // High Card
  const high=cards.slice().sort((a,b)=>cardValue(b)-cardValue(a)).slice(0,1);
  return {rank:0,message:"High Card",combination:high};
}
