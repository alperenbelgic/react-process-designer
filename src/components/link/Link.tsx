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

// function calculateCenter(linkModel: LinkModel): Point {
//     return {
//         x: (linkModel.start.x + linkModel.end.x) / 2,
//         y: (linkModel.start.y + linkModel.end.y) / 2
//     }
// }

// function LinkPart() {

// }

export function Link({ linkModel }: Props) {



    return <div></div>
}