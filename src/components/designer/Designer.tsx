/*
todo:
multiple selection by drawing from empty space
*/


import React, { MouseEvent, useCallback, useContext, useEffect, useLayoutEffect, useState } from 'react';
import './Designer.css'
import { Item, ItemModel, ItemVisualState } from '../item/Item'
import { DesignerClickedEventArgs, SelectingRectangle } from '../selecting-rectangle/SelectingRectangle';

const initialItems: ItemModel[] = [
  {
    visualState: {
      ...new ItemVisualState(),
      left: 30,
      top: 50,
      selected: true
    },
    value: { id: '1' }
  },
  {
    visualState: {
      ...new ItemVisualState(),
      left: 230,
      top: 250,
      selected: true
    },
    value: { id: '2' }
  },
  {
    visualState: {
      ...new ItemVisualState(),
      left: 630,
      top: 250,
      selected: true
    },
    value: { id: '3' }
  },
];

interface ClickedItem {
  item: ItemModel,
  selected: boolean,
  time: Date
}

export function Designer() {

  const [items, setItems] = useState<ItemModel[]>(initialItems);

  const [itemsMoving, setItemsMoving] = useState<boolean>(false);

  const [clickedItem, setClickedItem] = useState<ClickedItem | null>(null);

  const [designerClickedEvent, setDesignerClickedEvent] = useState<DesignerClickedEventArgs | null>(null);

  const onMouseMove = useCallback((event: any) => {

    const shiftX = event.movementX;
    const shiftY = event.movementY;

    if (itemsMoving) {
      const remainingItems = items.filter(i => !i.visualState.selected);
      const selectedItems = items.filter(i => i.visualState.selected);

      selectedItems.forEach(i => {
        remainingItems.push({
          ...i,
          visualState: {
            ...i.visualState,
            top: i.visualState.top + shiftY,
            left: i.visualState.left + shiftX
          }
        })
      });

      setItems(remainingItems);
    }

  }, [items, itemsMoving]);

  useLayoutEffect(() => {
    document.addEventListener('mousemove', onMouseMove);

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
    };

  }, [onMouseMove]);

  const revertItemSelection = (item: ItemModel, setSelectionTo?: boolean) => {
    setItems((items) => {

      const remainingItems = items.filter(i => i.value.id !== item.value.id);
      const itemInList = items.find(i => i.value.id === item.value.id) ?? {} as ItemModel;

      remainingItems.push({
        ...itemInList,
        visualState: {
          ...itemInList.visualState,
          selected: setSelectionTo ?? !itemInList?.visualState.selected
        }
      });

      return remainingItems;
    });
  }

  const onMouseUp = useCallback((event: any) => {

    setItemsMoving(false);

    if (clickedItem) {
      const diff = (new Date()).getTime() - clickedItem.time.getTime();

      if (diff < 300) {
        revertItemSelection(clickedItem.item, !clickedItem.selected);
      }
    }

  }, [clickedItem]);

  useLayoutEffect(() => {
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('mouseup', onMouseUp)
    };

  }, [onMouseUp]);

  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {

    setDesignerClickedEvent({
      xInContainer: (event.nativeEvent as any).layerX,
      yInContainer: (event.nativeEvent as any).layerY,
      xInViewPort: event.clientX,
      yInViewPort: event.clientY
    });

    const remainingItems = items.filter(i => !i.visualState.selected);

    items.filter(i => i.visualState.selected).forEach(j => {
      remainingItems.push({
        ...j,
        visualState: {
          ...j.visualState,
          selected: false
        }
      })
    })

    setItems(remainingItems);
  }

  const onItemClicked = (item: ItemModel) => {

    setClickedItem({ item, selected: item.visualState.selected, time: new Date() });

    revertItemSelection(item, true)

    setItemsMoving(true);
  }

  const handleSelectingRectangleDrawn = (selectionLocation: { top: number, left: number, bottom: number, right: number }) => {

    setItems((_items) => {
      const _selectedItems: ItemModel[] = [];
      const _remainingItems: ItemModel[] = [];

      _items.forEach(i => {
        const itemTop = i.visualState.top;
        const itemLeft = i.visualState.left;
        const itemRight = i.visualState.left + i.visualState.defaultWidth;
        const itemBottom = i.visualState.top + i.visualState.defaultHeight;

        if (itemTop > selectionLocation.bottom ||
          selectionLocation.top > itemBottom ||
          itemRight < selectionLocation.left ||
          selectionLocation.right < itemLeft) {

          _remainingItems.push(i);
        }
        else {
          _selectedItems.push(i);
        }
      });

      _selectedItems.forEach(i => {
        _remainingItems.push({
          ...i,
          visualState: {
            ...i.visualState,
            selected: true
          }
        })
      });

      return _remainingItems;

    });
  };

  return (

    <div className="container">

      <div className="header">
        header
      </div>

      <div className="page-content">

        <div className="left-menu">
          left menu
        </div>
        <div className="content" onMouseDown={handleMouseDown} >
          <div className="designer-container">

            {
              items.map(item => <Item key={item.value.id} itemModel={item} onClicked={onItemClicked} />)
            }

            <SelectingRectangle
              key="selectingRect"
              designerClicked={designerClickedEvent}
              rectangleDrawn={handleSelectingRectangleDrawn} />

          </div>
        </div>

      </div>

    </div>

  );
}