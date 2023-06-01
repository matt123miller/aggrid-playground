// eslint-disable-next-line @typescript-eslint/no-unused-vars
import styles from './app.module.scss';
import {
  GridApi,
  CellClickedEvent,
  ColDef,
  GridOptions,
  IDatasource,
  IGetRowsParams,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const App = () => {
  const gridRef = useRef(null); // Optional - for accessing Grid's API

  const datasource = useMemo(createDatasource, []);

  const createUserMutation = useMutation(
    () => {
      return fetch('http://localhost:4100/api/users', { method: 'POST' }).then(
        (res) => res.json()
      );
    },
    {
      onSuccess: () => {
        // result.refetch();
        (gridRef.current?.api as GridApi).refreshInfiniteCache();
      },
    }
  );

  const deleteUserMutation = useMutation(
    () => {
      return fetch('http://localhost:4100/api/users/deleteRandom', {
        method: 'DELETE',
      }).then((res) => res.json());
    },
    {
      onSuccess: () => {
        (gridRef.current?.api as GridApi).refreshInfiniteCache();
      },
    }
  );

  // const { data, isLoading } = result;

  const gridOptions: GridOptions = {
    rowModelType: 'infinite',
    getRowId: (row) => row.userId,
    debug: true,
    cacheBlockSize: 20,
    maxBlocksInCache: 2,
    datasource,
  };

  // Each Column Definition results in one Column.
  const columnDefs: ColDef[] = [
    { field: 'userId' },
    { field: 'username', filter: true },
    { field: 'email', filter: true },
    { field: 'birthdate', filter: 'agDateColumnFilter' },
  ];

  // DefaultColDef sets props common to all Columns
  const defaultColDef = {
    sortable: true,
  };

  // Example of consuming Grid Event
  const cellClickedListener = useCallback((event: CellClickedEvent) => {
    console.log('cellClicked', event);
  }, []);

  // Example using Grid's API
  const createListener = useCallback((_) => {
    createUserMutation.mutate();
  }, []);

  const deleteListener = () => {
    deleteUserMutation.mutate();
  };

  return (
    <div className="ag-theme-alpine" style={{ height: 1000, width: 1000 }}>
      <button onClick={createListener}>Add user</button>
      <button onClick={deleteListener}>Delete random user</button>
      <AgGridReact
        ref={gridRef} // Ref for accessing Grid's API
        gridOptions={gridOptions}
        columnDefs={columnDefs} // Column Defs for Columns
        defaultColDef={defaultColDef} // Default Column Properties
        animateRows={true} // Optional - set to 'true' to have rows animate when sorted
        rowSelection="multiple" // Options - allows click selection of rows
        onCellClicked={cellClickedListener} // Optional - registering for Grid Event
      />
    </div>
  );
};

export default App;

function createDatasource(): IDatasource {
  return {
    getRows: async (params: IGetRowsParams) => {
      console.log(params);

      const { startRow, endRow, filterModel, sortModel } = params;

      const queryUrl = new URL('http://localhost:4100/api/users');

      queryUrl.searchParams.set('startRow', startRow.toString());
      queryUrl.searchParams.set('endRow', endRow.toString());
      if (sortModel.length > 0) {
        const { colId, sort } = sortModel[0]!;
        queryUrl.searchParams.set('sortDir', sort);
        queryUrl.searchParams.set('sortColumn', colId);
      }
      for (const key in filterModel) {
        const { filterType, filter, type } = filterModel[key];
        console.log({ key, filterType, filter, type });
        queryUrl.searchParams.set(key, JSON.stringify(filterModel[key]));
      }

      const results = await fetch(queryUrl);
      const json = await results.json();
      params.successCallback(json, json.length);
    },
  };
}
