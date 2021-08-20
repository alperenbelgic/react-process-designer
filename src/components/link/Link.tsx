import './Link.css'

export interface Point {
    x: number;
    y: number;
}

export interface LinkModel {
    start: Point;
    end: Point;
}

interface Props {
    linkModel: LinkModel;
}

function getCenter(linkModel: LinkModel): Point {
    return {
        x: (linkModel.start.x + linkModel.end.x) / 2,
        y: (linkModel.start.y + linkModel.end.y) / 2
    }
}

function LinkParts(linkModel: LinkModel) {
    const center = getCenter(linkModel);

    const firstPart: LinkModel = {
        start: linkModel.start,
        end: center
    };

    const secondPart: LinkModel = {
        start: center,
        end: linkModel.end
    }
}

function hypot(linkModel: LinkModel) {
    const xDiff = Math.abs(linkModel.start.x - linkModel.end.x);
    const yDiff = Math.abs(linkModel.start.y - linkModel.end.y);

    if (xDiff === 0) return yDiff;
    if (yDiff === 0) return xDiff;

    return Math.hypot(xDiff, yDiff);
}

function arctan(linkModel: LinkModel) {

    const xDiff = Math.abs(linkModel.start.x - linkModel.end.x);
    const yDiff = Math.abs(linkModel.start.y - linkModel.end.y);

    return Math.atan2(-yDiff, xDiff);
}

export function Link({ linkModel }: Props) {
    const width = 10;
    const height = hypot(linkModel);

    const center = getCenter(linkModel);
    const left = center.x - width / 2;
    const top = center.y - height / 2;

    const rotation = arctan(linkModel);

    const transform = `rotate(${rotation}rad)`

    return <div
        className="link"
        style={{ width, height, top, left, transform }}
    ></div>
}