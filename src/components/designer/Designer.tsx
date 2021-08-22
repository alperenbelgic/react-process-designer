import React, { MouseEvent, useCallback, useContext, useLayoutEffect, useReducer, useState } from 'react';
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
        top: 17,
        selected: true
      }),
    value: { id: '1', linkedItems: ['2'] }
  },
  {
    visualState: Object.assign(new ItemVisualState(),
      {
        left: 230,
        top: 297,
        selected: true
      }),
    value: { id: '2', linkedItems: ['3'] }
  },
  {
    visualState: Object.assign(new ItemVisualState(),
      {
        left: 530,
        top: 437,
        selected: true
      }),
    value: { id: '3', linkedItems: [] }
  },
];

function itemsLeftView(items: ItemModel[]) {
  return items.some(i => i.visualState.left < 0 || i.visualState.top < 0);
}

function placeItemsInHorizontalLine(moving: ItemModel[]) {
  moving.forEach(i => {

    const mod = (i.visualState.top - 17) % 140;

    if (mod === 0) return;

    if (mod < 70) {
      i.visualState.top -= mod;
    }
    else {
      i.visualState.top += (140 - mod);
    }
  })
}

type DesignerAction =
  | { type: 'revert-item-selection', item: ItemModel, setSelectionTo?: boolean, ctrl?: boolean }
  | { type: 'unselect-all' }
  | { type: 'handle-items-dragging', shiftX: number, shiftY: number }
  | { type: 'handle-items-dragging-ended', canceled: boolean }
  | { type: 'handle-selecting-rectangle-drawn', selectionLocation: { top: number, left: number, bottom: number, right: number } }

interface DesignerState {
  items: ItemModel[];
}

const DesignerReducer = (state: DesignerState, action: DesignerAction): DesignerState => {
  switch (action.type) {
    case 'revert-item-selection': {

      let remainingItems = state.items.filter(i => i.value.id !== action.item.value.id);
      const itemInList = state.items.find(i => i.value.id === action.item.value.id) ?? {} as ItemModel;

      if (!action.ctrl) {
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
          selected: action.setSelectionTo ?? !itemInList?.visualState.selected
        })
      });

      return {
        ...state,
        items: remainingItems
      };
    }
    case 'unselect-all': {
      const remainingItems = state.items.filter(i => !i.visualState.selected);

      state.items.filter(i => i.visualState.selected).forEach(j => {
        remainingItems.push({
          ...j,
          visualState: Object.assign(new ItemVisualState(),
            {
              ...j.visualState,
              selected: false
            })
        })
      })

      return { ...state, items: remainingItems };
    }
    case 'handle-items-dragging': {

      const selected = state.items.filter(i => i.visualState.selected);
      const remaining = state.items.filter(i => !i.visualState.selected)

      selected.forEach(i => {
        remaining.push({
          ...i,
          visualState: Object.assign(new ItemVisualState(), {
            ...i.visualState,
            xShift: action.shiftX,
            yShift: action.shiftY,
            dragging: true
          })
        })
      });

      return {
        ...state,
        items: remaining
      };
    }
    case 'handle-items-dragging-ended': {
      const moving = state.items.filter(i => i.visualState.dragging);
      const remaining = state.items.filter(i => !i.visualState.dragging);

      const canceled = action.canceled || itemsLeftView(moving);

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

      return { ...state, items: remaining };
    }
    case 'handle-selecting-rectangle-drawn': {
      const _selectedItems: ItemModel[] = [];
      const _remainingItems: ItemModel[] = [];

      state.items.forEach(i => {
        const itemTop = i.visualState.top;
        const itemLeft = i.visualState.left;
        const itemRight = i.visualState.left + i.visualState.defaultWidth;
        const itemBottom = i.visualState.top + i.visualState.defaultHeight;

        if (itemTop > action.selectionLocation.bottom ||
          action.selectionLocation.top > itemBottom ||
          itemRight < action.selectionLocation.left ||
          action.selectionLocation.right < itemLeft) {

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

      return { ...state, items: _remainingItems };
    }
  }
}

class DesignerDispatchers {

}

export function Designer() {

  const [state, dispatch] = useReducer(DesignerReducer, { items: initialItems })

  const [designerClickedEvent, setDesignerClickedEvent] = useState<DesignerClickedEventArgs | null>(null);

  const handleMouseDown = useCallback((event: MouseEvent<HTMLDivElement>) => {

    setDesignerClickedEvent({
      xInContainer: (event.nativeEvent as any).offsetX,
      yInContainer: (event.nativeEvent as any).offsetY,
      xInViewPort: event.clientX,
      yInViewPort: event.clientY
    });

    dispatch({ type: 'unselect-all' });

  }, []);

  const handleItemsDragging = useCallback((shiftX: number, shiftY: number) => {

    dispatch({ type: 'handle-items-dragging', shiftX, shiftY });

  }, []);

  const handleItemDraggingEnded = useCallback((canceled) => {

    dispatch({ type: 'handle-items-dragging-ended', canceled })

  }, []);

  const mouseDragContext = useContext(MouseDragContext);

  const handleItemClicked =
    useCallback(
      (item: ItemModel, relativeX: number, relativeY: number, clientX: number, clientY: number, ctrl: boolean) => {

        const isItemSelectedBeforeClick = item.visualState.selected;

        if (!isItemSelectedBeforeClick) {
          dispatch({ type: 'revert-item-selection', item, setSelectionTo: true, ctrl: ctrl });
        }

        mouseDragContext.startDragging(relativeY, relativeY, clientX, clientY, {

          onMouseMoved: (x, y, shiftX, shiftY) => {

            handleItemsDragging(shiftX, shiftY);

          },
          onMouseUp: (canceled: boolean) => {

            if (canceled) {

              if (!ctrl && isItemSelectedBeforeClick && state.items.filter(i => i.visualState.selected).length > 1) {
                // there are other selected items and we click a selected one
                // in this case (I think) we keep only clicked one selected
                // instead of making them all unselected
                // I just feel like this :)
                // revertItemSelection(item, true, false);
                dispatch({ type: 'revert-item-selection', item, setSelectionTo: true, ctrl: false })

              }
              else {
                dispatch({ type: 'revert-item-selection', item, setSelectionTo: !isItemSelectedBeforeClick, ctrl: ctrl });
              }
            }

            handleItemDraggingEnded(canceled);
          }
        });

      }, [handleItemDraggingEnded, handleItemsDragging, mouseDragContext, state.items]);

  const handleSelectingRectangleDrawn = (selectionLocation: { top: number, left: number, bottom: number, right: number }) => {

    dispatch({ type: 'handle-selecting-rectangle-drawn', selectionLocation });
    
  };

  const links = useCallback(() => getLinks(state.items), [state.items]);

  return (

    <div className="container">

      <div className="header">
        header
      </div>

      <div className="page-content">

        <div className="left-menu">
          <div className="menu-container" >

          </div>
          <div className="button-container" >
            <button>Save</button>
          </div>
        </div>
        <div id="content" className="content" onMouseDown={handleMouseDown} >

          {/* this (positon:relative) div is for providing 
          an immediate non static parent for absolute positioned children*/}
          <div className="designer-container">

            {
              links().map(link => <Link linkModel={link} key={link.id} />)
            }

            {
              state.items.map(item => <Item key={item.value.id} itemModel={item} onClicked={handleItemClicked} />)
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

