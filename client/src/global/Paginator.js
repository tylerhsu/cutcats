import React from 'react';
import ReactPaginate from 'react-paginate';

export default function Paginator (props) {
  return (
    <ReactPaginate
      pageRangeDisplayed={5}
      marginPagesDisplayed={1}
      containerClassName={'paginator'}
      pageClassName={'page-item'}
      previousClassName={'page-item'}
      nextClassName={'page-item'}
      breakClassName={'page-item'}
      pageLinkClassName={'page-link'}
      previousLinkClassName={'page-link'}
      nextLinkClassName={'page-link'}
      breakLinkClassName={'page-link'}
      activeClassName={'active'}
      {...props}
    />
  );
}
