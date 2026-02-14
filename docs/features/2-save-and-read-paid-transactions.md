* Change transactions page so that when user makes a paid by selection, then instead of saving selection to local storage, backend API PUT `/api/transactions/paid` should be called with computed key and selection value

* Change transactions page so that when loading transactions by year and month, paidBy field should be read from API response and transactions table on page updated accordingly
* * API docs are at/Users/rolandv/repositories/expense-splitter-be/docs/api/swagger.json

* Remove now redundant handling of storing paid transactions in local storage


References:
API docs are at/Users/rolandv/repositories/expense-splitter-be/docs/api/swagger.json