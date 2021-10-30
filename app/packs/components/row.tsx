import * as React from "react"
import Rails from "@rails/ujs"
import Seat from "components/seat"
import { RowData, TicketData } from "components/venue"

interface RowProps {
  concertId: number
  rowData: RowData
  rowNumber: number
  seatsPerRow: number
  ticketsToBuyCount: number
}

const Row = (props: RowProps): React.ReactElement => {
  const [seatsStatuses, setSeatStatuses] = React.useState(
    Array.from(Array(props.seatsPerRow).keys()).map(() => "unsold")
  )

  React.useEffect(() => {
    if(props.rowData) {
      setSeatStatuses(
        props.rowData.map((ticketData: TicketData) => ticketData.status)
      )
    }
  }, [props.rowData])

  function isSeatValid(seatNumber: number): boolean {
    if (seatNumber + props.ticketsToBuyCount > props.seatsPerRow) {
      return false
    }
    for (let i = 1; i < props.ticketsToBuyCount; i++) {
      const seatStatus = seatsStatuses[seatNumber + i]      
      if(seatStatus === "held" || seatStatus === "purchased") {
        return false
      }
    }
    return true
  }

  function validSeatStatus(seatNumber: number): string {
    const seatStatus = seatsStatuses[seatNumber]
    if(seatStatus === "held" || seatStatus === "purchased") {
      return seatStatus
    } else {
      return isSeatValid(seatNumber) ? "Unsold" : "invalid"
    }
  }

  function newState(oldStatus: string): string {
    if (oldStatus === "unsold") {
      return "held"
    } else if (oldStatus === "held") {
      return "unsold"
    } else {
      return "invalid"
    }
  }

  function updateSeatStatus(seatNumber: number): string[] {
    return seatsStatuses.map((status: string, index: number) => {
      if(index >= seatNumber && index < seatNumber + props.ticketsToBuyCount) {
        return newState(seatsStatuses[seatNumber])
      } else {
        return status
      }
    })
  }

  function onSeatChange(seatNumber: number): void {
    const validStatus = validSeatStatus(seatNumber)
    if(validStatus === "invalid" || validStatus === "purchased") {
      return 
    }

    const newSeatStatuses = updateSeatStatus(seatNumber)
    setSeatStatuses(newSeatStatuses)
    fetch(`/shopping_carts`, {
      method: "POST",
      headers: {
        "X-CSRF-Token": Rails.csrfToken(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        concertId: props.concertId,
        row: props.rowNumber + 1,
        seatNumber: seatNumber + 1,
        status: newSeatStatuses[seatNumber],
        ticketsToBuyCount: props.ticketsToBuyCount,
      }),
    })
  }

  const seatItems = Array.from(Array(props.seatsPerRow).keys()).map(
    (seatNumber: number) => {
      return (
        <Seat
          clickHandler={onSeatChange}
          key={seatNumber}
          seatNumber={seatNumber}
          status={validSeatStatus(seatNumber)}            
        />
      )
    }
  )
  return <tr className="h-20">{seatItems}</tr>
}

export default Row