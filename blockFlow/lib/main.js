window.blockFlowContainer;
window.blockList = [];

window.BF_canvas;

const BF_HEAD_HEIGHT = 30;//标题栏高度
const BF_BODY_PADDING = 10;//节点伸出长度
const BF_TAG_HEIGHT = 20;//每个节点框高度
const BF_TAG_HEIGHT_MARGIN = 4;//上下空行

const BF_PORT_TYPE = {
    number: 1,
    text: 2,
    color: 3,
}

const BF_PORT_INPUT_TYPE = {
    input: 1,
    none: 2,
}

const BF_BLOCK_TYPE = {
    function: 1,
    draw: 2,
    input: 3,
    trans: 4
}
//创建容器
class BlockFlowContainer {
    constructor(parentDom) {
        this.parentDom = parentDom;
        window.blockFlowContainer = this.parentDom;
        //创建画布
        this.canvasDom = document.createElement("canvas");
        this.canvasDom.id = "blockFlowCanvas";
        this.canvasDom.width = parentDom.offsetWidth;
        this.canvasDom.height = parentDom.offsetHeight;
        this.parentDom.appendChild(this.canvasDom);
    }
}
//Input
class BF_Input {
    constructor(placeHolder = "") {
        this.placeHolder = placeHolder;
        this.dom;
    }
    createDom() {
        this.dom = document.createElement("input");
        this.dom.classList.add("BF_input");
        this.dom.classList.add("BF_cantMove");
        this.dom.type = "text";
        this.dom.style.height = BF_TAG_HEIGHT + "px";
        this.dom.style.lineHeight = BF_TAG_HEIGHT + "px";
        this.dom.style.maxWidth = "100px";
        this.dom.placeholder = this.placeHolder;
        return this;
    }
    getValue() {
        return this.dom.value;
    }
}
class BF_None {
    constructor() {
        this.dom;
    }
    createDom() {
        this.dom = document.createElement("input");
        this.dom.classList.add("BF_input");
        this.dom.type = "hidden";
        return this;
    }
    getValue() {
        return this.dom.value;
    }
}

//Port
class BF_BasicPort {
    constructor(
        tag = "tag",
        disb,
        type = BF_PORT_TYPE.text
    ) {
        this.tag = tag;
        this.disb = disb;
        this.type = type;
        this.portDom;
        this.tagDom;
        this.disbDom;
        this.value;
    }
    createDom() {
        //生成Port
        this.portDom = document.createElement("div");
        this.portDom.classList.add("BF_port");
        this.portDom.classList.add("BF_port_type_" + this.type);
        this.portDom.style.height = BF_BODY_PADDING + "px";
        this.portDom.style.width = BF_BODY_PADDING + "px";
        //生成TAG
        this.tagDom = document.createElement("div");
        this.tagDom.classList.add("BF_tag");
        this.tagDom.style.height = BF_TAG_HEIGHT + "px";
        this.tagDom.style.lineHeight = BF_TAG_HEIGHT + "px";
        this.tagDom.innerHTML = this.tag;
        //生成DISB
        this.disbDom = this.disb.createDom().dom;
        return this;
    }
}
//Block
class BF_BasicBlock {
    constructor(
        title = "bfBlock",
        position = {
            x: 100,
            y: 100
        },
        size = {
            width: 200,
            height: 100,
        },
        inPorts = [],
        outPorts = [],
        className = "defaultBlock",
        blockType = BF_BLOCK_TYPE.function,
        para = {}
    ) {
        this.title = title;
        this.position = position;
        this.size = size;
        this.inPorts = inPorts;
        this.outPorts = outPorts;
        this.className = className;
        this.blockType = blockType;
        this.para = para;
        this.blockDom;
        this.headDom;
        this.bodyDom;
        this.inPortAreaDom;
        this.outPortAreaDom;
        this.inPortsDom = [];
        this.outPortsDom = [];
        this.maskDom = [];
        this.closeButtonDom;
    }
    createDom() {
        let _ = this;
        //如果height<节点高度和就用节点高度和
        let currentHeight;
        if (this.size.height < Math.max(
            this.inPorts.length * (BF_HEAD_HEIGHT + BF_TAG_HEIGHT_MARGIN * 2),
            this.outPorts.length * (BF_HEAD_HEIGHT + BF_TAG_HEIGHT_MARGIN * 2),
        )) {
            currentHeight = Math.max(
                this.inPorts.length * (BF_HEAD_HEIGHT + BF_TAG_HEIGHT_MARGIN * 2),
                this.outPorts.length * (BF_HEAD_HEIGHT + BF_TAG_HEIGHT_MARGIN * 2),
            );
        } else {
            currentHeight = this.size.height;
        }
        //添加基础元素
        this.blockDom = document.createElement("div");
        this.blockDom.classList.add("BF_BasicBlock");
        this.blockDom.classList.add(this.className);
        this.blockDom.style.left = this.position.x + "px";
        this.blockDom.style.top = this.position.y + "px";
        this.blockDom.style.width = this.size.width + BF_BODY_PADDING * 2 + "px";
        this.blockDom.style.height = currentHeight + BF_HEAD_HEIGHT + "px";
        //实现拖动
        this.blockDom.onmousedown = function (event) {
            let canMove = true;
            for (let cclass of event.target.classList) {
                if (cclass == "BF_cantMove") {
                    canMove = false;
                    break;
                }
            }
            if (canMove) {
                //改变zindex置前
                _.blockDom.style.zIndex = 10;
                for (let other of window.blockList) {
                    if (other != _)
                        other.blockDom.style.zIndex = 1;
                }
                let ox = event.clientX - _.blockDom.offsetLeft;
                let oy = event.clientY - _.blockDom.offsetTop;
                if (ox > BF_BODY_PADDING && ox < _.size.width - BF_BODY_PADDING) {
                    document.onmousemove = function (event) {
                        let x = event.clientX - ox;
                        let y = event.clientY - oy;
                        _.blockDom.style.left = x + "px";
                        _.blockDom.style.top = y + "px";
                        _.position.x = x;
                        _.position.y = y;
                    };
                    document.onmouseup = function () {
                        document.onmousemove = null;
                        document.onmouseup = null;
                    };
                }
                return false;
            }
        };
        //添加标题栏
        this.headDom = document.createElement("div");
        this.headDom.classList.add("BF_head");
        this.headDom.classList.add("BF_block_type_" + this.blockType);
        this.headDom.style.width = this.size.width + "px";
        this.headDom.style.height = BF_HEAD_HEIGHT + "px";
        this.headDom.style.lineHeight = BF_HEAD_HEIGHT + "px";
        this.headDom.style.marginLeft = BF_BODY_PADDING + "px";
        this.headDom.innerHTML = "&nbsp;" + this.title;
        //添加关闭按钮
        this.closeButtonDom = document.createElement("div");
        this.closeButtonDom.classList.add("BF_closeButton");
        this.closeButtonDom.style.width = BF_HEAD_HEIGHT - 14 + "px";
        this.closeButtonDom.style.height = BF_HEAD_HEIGHT - 14 + "px";
        this.closeButtonDom.style.lineHeight = BF_HEAD_HEIGHT - 14 + "px";
        this.closeButtonDom.innerHTML = "╳";
        this.closeButtonDom.style.marginTop = 7 + "px";
        this.closeButtonDom.onclick = function () {
            _.blockDom.parentNode.removeChild(_.blockDom);
            for (let i = 0; i < window.blockList.length; i++) {
                let cblock = window.blockList[i];
                if (cblock == _) {
                    window.blockList.splice(i, 1);
                    break;
                }
            }
            console.log(window.blockList);
        }
        //添加主体区域【容纳tag和输入】
        this.bodyDom = document.createElement("div");
        this.bodyDom.classList.add("BF_body");
        this.bodyDom.style.width = this.size.width + BF_BODY_PADDING * 2 + "px";
        this.bodyDom.style.height = currentHeight + "px";
        //添加I区域
        this.inPortAreaDom = document.createElement("div");
        this.inPortAreaDom.classList.add("BF_inPortArea");
        this.inPortAreaDom.classList.add("BF_portArea");
        this.inPortAreaDom.style.width = (this.size.width + BF_BODY_PADDING * 2) / 2 + "px";
        this.inPortAreaDom.style.height = currentHeight + "px";
        //添加O区域
        this.outPortAreaDom = document.createElement("div");
        this.outPortAreaDom.classList.add("BF_outPortArea");
        this.outPortAreaDom.classList.add("BF_portArea");
        this.outPortAreaDom.style.width = (this.size.width + BF_BODY_PADDING * 2) / 2 + "px";
        this.outPortAreaDom.style.height = currentHeight + "px";
        //添加遮罩层
        this.maskDom = document.createElement("div");
        this.maskDom.classList.add("BF_mask");
        this.maskDom.classList.add("BF_block_type_" + this.blockType);
        this.maskDom.style.width = this.size.width + "px";
        this.maskDom.style.height = currentHeight + "px";
        this.maskDom.style.marginLeft = BF_BODY_PADDING + "px";
        this.maskDom.style.top = BF_HEAD_HEIGHT + "px";
        //添加DOM元素到文档
        window.blockFlowContainer.appendChild(this.blockDom);
        this.headDom.appendChild(this.closeButtonDom);
        this.blockDom.appendChild(this.maskDom);
        this.blockDom.appendChild(this.headDom);
        this.blockDom.appendChild(this.bodyDom);
        this.bodyDom.appendChild(this.inPortAreaDom);
        this.bodyDom.appendChild(this.outPortAreaDom);
        //添加I端口
        for (let port of this.inPorts) {
            let domPortTemp = document.createElement("div");
            domPortTemp.classList.add("BF_PortDivDom");
            domPortTemp.style.height = BF_TAG_HEIGHT + BF_TAG_HEIGHT_MARGIN * 2 + "px";
            let domPortInnerTemp = createPort(port).createDom();
            domPortTemp.appendChild(domPortInnerTemp.portDom);
            domPortTemp.appendChild(domPortInnerTemp.tagDom);
            domPortTemp.appendChild(domPortInnerTemp.disbDom);
            this.inPortAreaDom.appendChild(domPortTemp);
        }
        //添加O端口
        for (let port of this.outPorts) {
            let domPortTemp = document.createElement("div");
            domPortTemp.classList.add("BF_PortDivDom");
            domPortTemp.style.height = BF_TAG_HEIGHT + BF_TAG_HEIGHT_MARGIN * 2 + "px";
            let domPortInnerTemp = createPort(port).createDom();
            domPortTemp.appendChild(domPortInnerTemp.disbDom);
            domPortTemp.appendChild(domPortInnerTemp.tagDom);
            domPortTemp.appendChild(domPortInnerTemp.portDom);
            this.outPortAreaDom.appendChild(domPortTemp);
        }
    }
}
function createBlockFlowContainer(parentDom) {
    window.BF_canvas = new BlockFlowContainer(parentDom);
}
//生成端口输入框
// {
//     type:
// }
function createPortInput(inputObject) {
    switch (inputObject.type) {
        case BF_PORT_INPUT_TYPE.input: {
            return new BF_Input(inputObject.placeHolder);
        }
        case BF_PORT_INPUT_TYPE.none: {
            return new BF_None();
        }
    }
}
//生成端口
// {
//     tag:
//     disb:inputObject
//     type:
// }
function createPort(tagObject) {
    let inputObject = createPortInput(tagObject.disb);
    return new BF_BasicPort(
        tagObject.tag,
        inputObject.createDom(),
        tagObject.type
    )
}
function createBFBasicBlock(
    title = "bfBlock",
    position = { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    size = { width: 200, height: 100 },
    inPorts = [],
    outPorts = [],
    className = "defaultBlock",
    blockType = BF_BLOCK_TYPE.function
) {
    let currentBlock = new BF_BasicBlock(title, position, size, inPorts, outPorts, className, blockType);
    window.blockList.push(currentBlock);
    currentBlock.createDom();
    return (currentBlock);
}
//导出当前视图的JSON
function outputJson() {
    return JSON.stringify(window.blockList);
}
//加载JSON
function inputJson(jsonInput) {
    console.log(JSON.parse(jsonInput));
    for (let block of JSON.parse(jsonInput)) {
        let currentBlock = new BF_BasicBlock();
        for (let key in currentBlock) {
            console.log(key);
            if (key in block) {
                currentBlock[key] = block[key];
            }
            console.log(currentBlock);
        }
        window.blockList.push(currentBlock);
        currentBlock.createDom();
    }
}