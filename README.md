# Problem Statement
The Nabis platform relies on a WMS for inventory quantity. When an order is created we must first validate the available quantity of the line items of the order. This is typically facilitated by accessing our WMS's API. 
The core problem is **inventory inconsistency** and **overselling** caused by technical limitations external to our system. The WMS performs critical inventory allocation via a batch job that runs only every **15 minutes** creating a window where Nabis's inventory data can be stale, resulting in overselling. Additionally our typical volume of order placement causes rate limiting from their API.
## Goal
Design and implement the architecture that maintains available inventory quantity for the Nabis platform while taking care of rate limiting and technical limitations of the backing WMS. Please frame your solution with NodeJs and Postgresql.
## Glossary of Terms

| **Term**                   | **Definition**                                                                                                                                           | **Contextual Relevance**                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **WMS**                    | **Warehouse Management System**. Software used to control and manage daily warehouse operations from inventory intake to shipment.                       | The external system Nabis uses as the backing store of inventory information. |
| **3PL**                    | **Third-Party Logistics.** A service provider that manages a company's warehousing, inventory, and fulfillment (e.g., Nabis acting as a 3PL for brands). | The business model driving the need for WMS flexibility (PaaS).               |
| **SKU**                    | **Stock Keeping Unit.** A unique code for a product, used for inventory tracking.                                                                        | Represents the core product identifier tracked by the Inventory Service.      |
| **SKU-Batch / Item-Batch** | A specific quantity of a SKU/Item that arrived together and might have unique attributes (e.g., expiration date, lot number).                            | Inventory is tracked at this granular level in the system.                    |
| **Orderable Quantity**     | The quantity of an item that is currently physically available for sale and allocation in the WMS.                                                       | The input quantity provided by a WMS                                          |
| **Unallocatable Quantity** | Inventory quantity that is physically present but unavailable for sale (e.g., damaged, quarantined, reserved).                                           | Nabis needs to own and track these extended states                            |

# Expectations and Deliverables

## Code
Clone the Repository and provide your own version as a ___zip file___. Your repository should include some code to assist in describing your solution. The code must be production-quality, testable, and demonstrate the core logic of your proposed architecture. Some examples (but not required, entirely dependent on your solution): 
- WMS API interface.
- ORM models that represent the data and schema.
- What would the core `InventoryService` consist of? How would it manage the platform's **Available Quantity** as the source of truth, tracking both _incoming_ and _outgoing_ inventory changes based on input?
- How would you test your POC?  How would you simulate the scenario of two rapid, competing orders and prove that the second order is correctly blocked by your Inventory Service's real-time count. 

## Data Modeling
Entity Relationship Diagram (ERD): Provide a simplified ERD focusing on the **Inventory Service's** core entities required to track state. This should include entities like: 
- Inventory
- SKU/Item-Batch
- Etc. 

## System Design and Strategy
Architecture Diagram: Provide a clear, high-level diagram illustrating the architecture. Show the flow during initial order creation and separate adjustments to Inventory:

- How does the Inventory Service capture and reduce the available quantity when a new order is created on the Nabis Platform?
- How do you reliably capture inventory quantity _increases_ (from receipts/adjustments) process them in an asynchronous manner? 
- Propose a resilient technical mechanism to guarantee that an item sold on the Nabis Platform is immediately reserved/unavailable for all subsequent orders.