import React, { MouseEvent, useCallback, useContext, useLayoutEffect, useState } from 'react';
import './Designer.css'
import { Item, ItemModel, ItemVisualState } from '../item/Item'
import { DesignerClickedEventArgs, SelectingRectangle } from '../selecting-rectangle/SelectingRectangle';
import { MouseDragContext } from '../../contexts/MouseDragService';
import { Link, getLinks } from '../link/Link';

const initialItems: ItemModel[] = [
  {
    visualState: Object.assign(new ItemVisualState(),
      {
        left: 30,
        top: 50,
        selected: true
      }),
    value: { id: '1', linkedItems: ['2'] }
  },
  {
    visualState: Object.assign(new ItemVisualState(),
      {
        left: 230,
        top: 250,
        selected: true
      }),
    value: { id: '2', linkedItems: ['3'] }
  },
  {
    visualState: Object.assign(new ItemVisualState(),
      {
        left: 530,
        top: 450,
        selected: true
      }),
    value: { id: '3', linkedItems: [] }
  },
];

function itemsLeftView(items: ItemModel[]) {
  return items.some(i => i.visualState.left < 0 || i.visualState.top < 0);
}

export function Designer() {

  const [items, setItems] = useState<ItemModel[]>(initialItems);

  const [designerClickedEvent, setDesignerClickedEvent] = useState<DesignerClickedEventArgs | null>(null);

  const revertItemSelection = useCallback((item: ItemModel, setSelectionTo?: boolean, ctrl?: boolean) => {
    setItems((items) => {

      let remainingItems = items.filter(i => i.value.id !== item.value.id);
      const itemInList = items.find(i => i.value.id === item.value.id) ?? {} as ItemModel;

      if (!ctrl) {
        // make them all others unselected
        remainingItems = remainingItems.map((i: ItemModel) => {
          return {
            ...i,
            visualState: Object.assign(new ItemVisualState(), {
              ...i.visualState,
              selected: false
            })
          }
        });
      }

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

  const handleMouseDown = useCallback((event: MouseEvent<HTMLDivElement>) => {

    setItems(_items => {

      setDesignerClickedEvent({
        xInContainer: (event.nativeEvent as any).offsetX,
        yInContainer: (event.nativeEvent as any).offsetY,
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


  const handleItemDraggingEnded = useCallback((canceled) => {

    setItems(_items => {

      const moving = _items.filter(i => i.visualState.dragging);
      const remaining = _items.filter(i => !i.visualState.dragging);

      canceled = canceled || itemsLeftView(moving);

      moving.forEach(i => {

        if (canceled) {
          i.visualState.xShift = i.visualState.yShift = 0;
        }
        else {
          i.visualState.includeShift();
        }
      });

      if (!canceled) {
        placeItemsInHorizontalLine(moving);
      }

      moving.forEach(i => {

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
      (item: ItemModel, relativeX: number, relativeY: number, clientX: number, clientY: number, ctrl: boolean) => {

        const isItemSelectedBeforeClick = item.visualState.selected;

        if (!isItemSelectedBeforeClick) {
          revertItemSelection(item, true, ctrl);
        }

        mouseDragContext.startDragging(relativeY, relativeY, clientX, clientY, {

          onMouseMoved: (x, y, shiftX, shiftY) => {

            handleItemsDragging(shiftX, shiftY);

          },
          onMouseUp: (canceled: boolean) => {

            if (canceled) {

              if (!ctrl && isItemSelectedBeforeClick && items.filter(i => i.visualState.selected).length > 1) {
                // there are other selected items and we click a selected one
                // in this case (I think) we keep only clicked one selected
                // instead of making them all unselected
                // I just feel like this :)
                revertItemSelection(item, true, false);
              }
              else {
                revertItemSelection(item, !isItemSelectedBeforeClick, ctrl);
              }
            }

            handleItemDraggingEnded(canceled);
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

  const links = useCallback(() => getLinks(items), [items]);

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

          {/* this (positon:relative) div is for providing 
          an immediate non static parent for absolute positioned children*/}
          <div className="designer-container">

            {
              links().map(link => <Link linkModel={link} key={link.id} />)
            }

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

function placeItemsInHorizontalLine(moving: ItemModel[]) {
  moving.forEach(i => {

    console.log('top', i.visualState.top)

    const mod = (i.visualState.top - 17) % 140;
    console.log('mod', mod)

    if (mod === 0) return;

    if (mod < 70) {
      i.visualState.top -= mod;
    }
    else {
      i.visualState.top += (140 - mod);
    }

    console.log('final top', i.visualState.top)

  })

}

