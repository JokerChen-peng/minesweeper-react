import React from 'react';
import './MineSweeper.css';

interface MineSweeperProps{
    selectDifficulty:()=>void;
}

interface MineSweeperState{
    width:number;
    height:number;
    mineCount:number;
    isEnd:boolean;
    mines:Array<number>;
    openStatus:Array<number>;
    markStatus:Array<number>;
    neighbourMineCount:Array<number>;
    selectedMineCount:number;
}

function shuffle<T>(mines:Array<T>):void {
    for (let i = 1; i < mines.length; i++) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        const tmp = mines[randomIndex];
        mines[randomIndex] = mines[i];
        mines[i] = tmp;
    }
}

function floodfill(
    x:number,
    y:number,
    openStatus:Array<number>,
    width:number,
    height:number,
    neighbourMineCount:Array<number>
):void{
    if (x < 0 || y < 0 || x === height || y === width) {
        return;
    }
    const index = x * width + y;
    if (openStatus[index] === 1) {
        return;
    }
    openStatus[index] = 1;
    if (neighbourMineCount[index] > 0) {
        return;
    }
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            floodfill(x + i, y + j,openStatus,width,height,neighbourMineCount);
        }
    }
}

function calcNeighbourMineCount(width:number,height:number,mines:Array<number>):Array<number>{
    const result = new Array(mines.length).fill(0);
    for (let i = 0; i < result.length; i++) {
        if (mines[i]) {
            continue;
        }
        const y = i % width;
        const x = (i - y) / width;
        for (let j = -1; j < 2; j++) {
            const newX = x + j;
            if (newX < 0 || newX === height) {
                continue;
            }
            for (let k = -1; k < 2; k++) {
                const newY = y + k;
                if (newY < 0 || newY ===width) {
                    continue;
                }
                if (mines[newX * width + newY]) {
                    result[i]++;
                }
            }
        }
    }
    return result;
}

const panelFlagStyle = {
    'fontSize':60,
};
const panelButton2Style = {
    'marginTop':'15px',
};

export default class MineSweeper extends React.Component<MineSweeperProps,MineSweeperState>{
    constructor(props:MineSweeperProps){
        super(props);
        this.state = {
            width: 0,
            height: 0,
            mineCount: 0,
            isEnd: false,
            mines: [],
            openStatus: [],
            markStatus: [],
            neighbourMineCount:[],
            // TODO 自动判定胜利
            selectedMineCount:0,
        };
    }

    reStart = ()=>{
        const {
            width,
            height,
            mineCount,
        } = this.state;

        this.init(width,height,mineCount);
    }

    selectDifficulty = ()=>{
        this.props.selectDifficulty();
    }

    init(width:number,height:number,mineCount:number):void{
        const total = width * height;
        const mines = new Array(total).fill(0);
        for (let i = 0; i < mineCount; i++) {
            mines[i] = 1;
        }
        shuffle<number>(mines);
        const neighbourMineCount = calcNeighbourMineCount(width,height,mines);
        this.setState({
            width,
            height,
            mineCount,
            isEnd:false,
            mines,
            openStatus:new Array(total).fill(0),
            markStatus:new Array(total).fill(0),
            neighbourMineCount,
        });
    }

    handleClickLeft(x:number,y:number):void{
        if(this.state.isEnd){
            return;
        }
        const index = x*this.state.width+y;
        if(this.state.openStatus[index] === 1 || this.state.markStatus[index] === 1){
            return;
        }
        if(this.state.mines[index]){
            const openStatus = this.state.openStatus.slice(0);
            openStatus[index] = 1;
            this.setState({
                isEnd:true,
                openStatus,
            });
            alert('mine');
            // TODO nextTick
            return;
        }

        if(this.state.neighbourMineCount[index]>0){
            const openStatus = this.state.openStatus.slice(0);
            openStatus[index] = 1;
            this.setState({
                openStatus,
            });
            return;
        }

        const openStatus = this.state.openStatus.slice(0);
        floodfill(x,y,openStatus,this.state.width,this.state.height,this.state.neighbourMineCount);
        this.setState({
            openStatus,
        });
    }

    handleClickRight(x:number,y:number):void{
        if(this.state.isEnd){
            return;
        }
        const index = x*this.state.width+y;
        if(this.state.openStatus[index] === 1){
            return;
        }
        const markStatus = this.state.markStatus.slice(0);
        markStatus[index] = (markStatus[index]+1)%3;
        let selectedMineCount = this.state.selectedMineCount;
        if(markStatus[index] === 2){
            selectedMineCount--;
        }else if(markStatus[index] === 1){
            selectedMineCount++;
        }
        this.setState({
            markStatus,
            selectedMineCount,
        });
    }

    handleContextMenu = (event:React.MouseEvent)=>{
        event.preventDefault();
    }

    renderMines(){
        const mines = [];
        for(let i=0;i<this.state.height;i++){
            const row = [];
            for(let j=0;j<this.state.width;j++){
                const index = i*this.state.width+j;
                let icon = null;
                if(this.state.markStatus[index] === 1){
                    icon = (
                        <span className="iconfont">&#xe778;</span>
                    );
                }else if(this.state.markStatus[index] === 2){
                    icon = (
                        <span className="iconfont">&#xe720;</span>
                    );
                }else if(this.state.openStatus[index] === 1){
                    if(this.state.mines[index]){
                        icon = (
                            <span className="iconfont">&#xe63a;</span>
                        );
                    }else if(this.state.neighbourMineCount[index]>0){
                        icon = (
                            <span>
                                {this.state.neighbourMineCount[index]}    
                            </span>
                        );
                    }
                }

                row.push(
                    <div 
                        className={`mine-sweeper-item ${this.state.openStatus[index]?'is-open':''}`}
                        key={j}
                        onClick={()=>this.handleClickLeft(i,j)}
                        onContextMenu={(e)=>this.handleClickRight(i,j)}
                    >
                        {icon}
                    </div>
                );
            }
            mines.push(
                <div className="mine-sweeper-row" key={i}>
                    {row}
                </div>
            );
        }


        return (
            <div 
                className="mine-sweeper-container"
                onContextMenu={this.handleContextMenu}
            >
                {mines}
            </div>
        );
    }

    render(){
        return (
            <div className="app-section game-container" >
                {this.renderMines()}
                <div className="panel-container">
                    <div className="panel-data-container">
                        <span
                            className="iconfont"
                            style={panelFlagStyle}
                        >&#xe778;</span>
                        <div>
                            {this.state.selectedMineCount} / { this.state.mineCount }
                        </div>
                    </div>
                    <div>
                        <button
                            className="mine-sweeper-button"
                            onClick={this.reStart}
                        >
                            重开一局
                        </button>

                        <button
                            className="mine-sweeper-button"
                            style= {panelButton2Style}
                            onClick={this.selectDifficulty}
                        >
                            改变难度
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}