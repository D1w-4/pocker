class Message {
  constructor(
    public id: string | number,
    public route: string,
    public body: any) {
  }
}


const HEADER = 5;

const bt2Str = function (byteArray: Uint16Array, start: number, end: number) {
  var result = "";
  for(var i = start; i < byteArray.length && i<end; i++) {
    result = result + String.fromCharCode(byteArray[i]);
  };
  return result;
};

export const Protocol = {
  encode(id: number, route: string, msg: object): string {
    var msgStr = JSON.stringify(msg);
    if (route.length>255) { throw new Error('route maxlength is overflow'); }
    var byteArray = new Uint16Array(HEADER + route.length + msgStr.length);
    var index = 0;
    byteArray[index++] = (id>>24) & 0xFF;
    byteArray[index++] = (id>>16) & 0xFF;
    byteArray[index++] = (id>>8) & 0xFF;
    byteArray[index++] = id & 0xFF;
    byteArray[index++] = route.length & 0xFF;
    for(var i = 0;i<route.length;i++){
      byteArray[index++] = route.charCodeAt(i);
    }
    for (var i = 0; i < msgStr.length; i++) {
      byteArray[index++] = msgStr.charCodeAt(i);
    }
    return bt2Str(byteArray,0,byteArray.length);
  },

  decode(msg: any): Message {
    var idx, len = msg.length, arr = new Array(len);
    for (idx = 0; idx < len; ++idx) {
      arr[idx] = msg.charCodeAt(idx);
    }
    var index = 0;
    var buf = new Uint16Array(arr);
    var id = ((buf[index++] << 24) | (buf[index++]) << 16 | (buf[index++]) << 8 | buf[index++]) >>> 0;
    var routeLen = buf[HEADER - 1];
    var route = bt2Str(buf, HEADER, routeLen + HEADER);
    var body = bt2Str(buf, routeLen + HEADER, buf.length);
    return new Message(id, route, body);
  }
};
