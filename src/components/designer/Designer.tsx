import React, { MouseEvent, useCallback, useContext, useLayoutEffect, useRef, useState } from 'react';
import './Designer.css'
import { Item, ItemModel, ItemVisualState } from '../item/Item'
import { DesignerClickedEventArgs, SelectingRectangle } from '../selecting-rectangle/SelectingRectangle';
import { MouseDragContext } from '../../contexts/MouseDragService';


const initialItems: ItemModel[] = [
  {
    visualState: Object.assign(new ItemVisualState(),
      {
        left: 30,
        top: 50,
        selected: true
      }),
    value: { id: '1' }
  },
  {
    visualState: Object.assign(new ItemVisualState(),
      {
        left: 230,
        top: 250,
        selected: true
      }),
    value: { id: '2' }
  },
  {
    visualState: Object.assign(new ItemVisualState(),
      {
        left: 630,
        top: 250,
        selected: true
      }),
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

  const [clickedItem, setClickedItem] = useState<ClickedItem | null>(null);

  const [designerClickedEvent, setDesignerClickedEvent] = useState<DesignerClickedEventArgs | null>(null);


  const revertItemSelection = useCallback((item: ItemModel, setSelectionTo?: boolean) => {
    setItems((items) => {

      const remainingItems = items.filter(i => i.value.id !== item.value.id);
      const itemInList = items.find(i => i.value.id === item.value.id) ?? {} as ItemModel;

      remainingItems.push({
        ...itemInList,
        visualState: Object.assign(new ItemVisualState(), {
          ...itemInList.visualState,
          selected: setSelectionTo ?? !itemInList?.visualState.selected
        })
      });

      return remainingItems;
    });
  }, []);

  const onMouseUp = useCallback((event: any) => {

    if (clickedItem) {
      const diff = (new Date()).getTime() - clickedItem.time.getTime();

      if (diff < 300) {
        revertItemSelection(clickedItem.item, !clickedItem.selected);
      }

      setClickedItem(null);
    }

  }, [clickedItem, revertItemSelection]);

  useLayoutEffect(() => {
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('mouseup', onMouseUp)
    };

  }, [onMouseUp]);

  const handleMouseDown = useCallback((event: MouseEvent<HTMLDivElement>) => {

    setItems(_items => {
      setDesignerClickedEvent({
        xInContainer: (event.nativeEvent as any).layerX,
        yInContainer: (event.nativeEvent as any).layerY,
        xInViewPort: event.clientX,
        yInViewPort: event.clientY
      });

      const remainingItems = _items.filter(i => !i.visualState.selected);

      _items.filter(i => i.visualState.selected).forEach(j => {
        remainingItems.push({
          ...j,
          visualState: Object.assign(new ItemVisualState(),
            {
              ...j.visualState,
              selected: false
            })
        })
      })

      return remainingItems;

    });
  }, []);

  const handleItemsDragging = useCallback((shiftX: number, shiftY: number) => {

    setItems(_items => {

      const selected = _items.filter(i => i.visualState.selected);
      const remaining = _items.filter(i => !i.visualState.selected)

      selected.forEach(i => {
        remaining.push({
          ...i,
          visualState: Object.assign(new ItemVisualState(), {
            ...i.visualState,
            xShift: shiftX,
            yShift: shiftY,
            dragging: true
          })
        })
      });

      return remaining;
    });


  }, []);


  const handleItemDraggingEnded = useCallback(() => {

    setItems(_items => {

      const moving = _items.filter(i => i.visualState.dragging);
      const remaining = _items.filter(i => !i.visualState.dragging);

      moving.forEach(i => {

        i.visualState.includeShift();

        remaining.push({
          ...i,
          visualState: Object.assign(new ItemVisualState(), {
            ...i.visualState,
            dragging: false
          })
        })
      });

      return remaining;
    });

  }, []);

  const mouseDragContext = useContext(MouseDragContext);

  const handleItemClicked =
    useCallback(
      (item: ItemModel, relativeX: number, relativeY: number, clientX: number, clientY: number) => {

        revertItemSelection(item, true)

        setClickedItem({ item, selected: item.visualState.selected, time: new Date() });

        mouseDragContext.startDragging(relativeY, relativeY, clientX, clientY, {

          onMouseMoved: (x, y, shiftX, shiftY) => {

            handleItemsDragging(shiftX, shiftY);

          },
          onMouseUp: () => {

            handleItemDraggingEnded();
          }
        });


      }, [handleItemDraggingEnded, handleItemsDragging, mouseDragContext, revertItemSelection]);

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
          visualState: Object.assign(new ItemVisualState(),
            {
              ...i.visualState,
              selected: true
            })
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
        <div id="content" className="content" onMouseDown={handleMouseDown} >
          <div className="designer-container">

            {
              items.map(item => <Item key={item.value.id} itemModel={item} onClicked={handleItemClicked} />)
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