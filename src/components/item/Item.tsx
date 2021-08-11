import React, { MouseEventHandler, useCallback, useEffect, useRef } from 'react';
import { isConstructorDeclaration } from 'typescript';
import './Item.css'

interface ViewModel {
  itemModel: ItemModel,
  onClicked: (item: ItemModel) => void
}

export interface ItemModel {
  visualState: ItemVisualState;

  value: ItemValue;
}

export interface ItemVisualState {
  left: number;
  top: number;

  selected: boolean;
  clickedTime?: Date;

  leftBeforeClicked?: number;
  topBeforeClicked?: number;
}

export interface ItemValue {
  id: string;
}

function _Item({ itemModel, onClicked }: ViewModel) {
  const handleMouseDown = (event: any) => {

    event.stopPropagation();

    onClicked(itemModel);
  }

  return (
    <div className="item"
      onMouseDown={handleMouseDown}
      style={{ left: itemModel.visualState.left, top: itemModel.visualState.top }}
    >
      {itemModel.value.id} - {itemModel.visualState.selected ? 'true' : 'false'}
    </div>
  );
}

export const Item = React.memo(_Item, (prev, next) => { return false; });