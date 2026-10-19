import { clearVerification } from "./refund-review";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PartnerConfiguration } from "@/embed/types";
import type {
  AcquisitionType,
  ArmenianRegion,
  Evidence,
  MortgageEligibilityFacts,
  PropertyLocation,
} from "@/lib/financing/income-tax-refund";

type Refund = PartnerConfiguration["refund"];
type Development = Refund["developments"][number];
type Property = Refund["propertyEvidence"][number];
const selectStyle = "w-full rounded-md border p-2 bg-background text-sm";
const regions: [ArmenianRegion, string][] = [
  ["aragatsotn", "Aragatsotn"],
  ["ararat", "Ararat"],
  ["armavir", "Armavir"],
  ["kotayk", "Kotayk"],
  ["shirak", "Shirak"],
  ["lori", "Lori"],
  ["tavush", "Tavush"],
  ["gegharkunik", "Gegharkunik"],
  ["syunik", "Syunik"],
  ["vayots_dzor", "Vayots Dzor"],
];
const acquisitions: [AcquisitionType, string][] = [
  ["developer_apartment", "Apartment bought directly from developer"],
  ["developer_house", "House bought directly from developer"],
  ["state_or_community_apartment", "State or community apartment"],
  ["self_build_house", "Self-built house"],
  ["secondary_market", "Secondary market purchase"],
  ["assignment_from_individual", "Rights assigned by an individual"],
  [
    "construction_right_acquisition",
    "Construction-right acquisition (special review)",
  ],
];

/** Changing a value always clears its verification; staff must review the new fact. */
function Fact<T>({
  title,
  value,
  change,
  children,
}: {
  title: string;
  value: Evidence<T> | undefined;
  change: (value: Evidence<T>) => void;
  children: (
    value: T | undefined,
    change: (value: T | undefined) => void,
  ) => ReactNode;
}) {
  return (
    <div className="rounded-lg border p-3 space-y-2">
      <p className="text-sm font-medium">{title}</p>
      {children(value?.value, (next) =>
        change(next === undefined ? null : { value: next, verified: false }),
      )}
      <label className="flex gap-2 items-start text-xs">
        <input
          type="checkbox"
          aria-label={`${title}: verified from documents`}
          disabled={!value}
          checked={value?.verified === true}
          onChange={(event) => {
            if (value) change({ ...value, verified: event.target.checked });
          }}
        />
        Verified from documents
      </label>
      <p className="text-xs text-muted-foreground">
        {!value
          ? "Unknown — no fact recorded"
          : value.verified
            ? "Reviewed — document reference required below"
            : "Recorded — awaiting document review"}
      </p>
    </div>
  );
}
function BooleanFact({
  title,
  value,
  change,
}: {
  title: string;
  value: Evidence<boolean> | undefined;
  change: (value: Evidence<boolean>) => void;
}) {
  return (
    <Fact title={title} value={value} change={change}>
      {(current, update) => (
        <select
          aria-label={title}
          className={selectStyle}
          value={current === undefined ? "" : String(current)}
          onChange={(event) =>
            update(
              event.target.value === ""
                ? undefined
                : event.target.value === "true",
            )
          }
        >
          <option value="">Unknown</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      )}
    </Fact>
  );
}
function CommonFacts({
  facts,
  change,
}: {
  facts: Partial<MortgageEligibilityFacts>;
  change: (facts: Partial<MortgageEligibilityFacts>) => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <Fact
        title="Acquisition type"
        value={facts.acquisitionType}
        change={(value) => change({ ...facts, acquisitionType: value })}
      >
        {(current, update) => (
          <select
            aria-label="Acquisition type"
            className={selectStyle}
            value={current ?? ""}
            onChange={(event) =>
              update(
                event.target.value
                  ? (event.target.value as AcquisitionType)
                  : undefined,
              )
            }
          >
            <option value="">Unknown</option>
            {acquisitions.map(([value, name]) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
        )}
      </Fact>
      <Fact<PropertyLocation>
        title="Property location"
        value={facts.location}
        change={(value) => change({ ...facts, location: value })}
      >
        {(current, update) => (
          <div className="space-y-2">
            <select
              aria-label="Property region"
              className={selectStyle}
              value={current?.region ?? ""}
              onChange={(event) => {
                const region = event.target.value;
                update(
                  !region
                    ? undefined
                    : region === "yerevan"
                      ? { region, valuationZone: null }
                      : region === "outside_armenia"
                        ? { region }
                        : {
                            region: region as ArmenianRegion,
                            governmentBorderSettlement: null,
                          },
                );
              }}
            >
              <option value="">Unknown</option>
              <option value="yerevan">Yerevan</option>
              {regions.map(([value, name]) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ))}
              <option value="outside_armenia">Outside Armenia</option>
            </select>
            {current?.region === "yerevan" && (
              <select
                aria-label="Official valuation zone"
                className={selectStyle}
                value={current.valuationZone ?? ""}
                onChange={(event) =>
                  update({
                    ...current,
                    valuationZone:
                      event.target.value === ""
                        ? null
                        : event.target.value === "other"
                          ? "other"
                          : (Number(event.target.value) as 1 | 2 | 3),
                  })
                }
              >
                <option value="">Zone unknown</option>
                <option value="1">Zone 1</option>
                <option value="2">Zone 2</option>
                <option value="3">Zone 3</option>
                <option value="other">Other zone</option>
              </select>
            )}
            {current &&
              current.region !== "yerevan" &&
              current.region !== "outside_armenia" && (
                <BooleanFact
                  title="Government-listed border settlement"
                  value={current.governmentBorderSettlement}
                  change={(value) =>
                    update({ ...current, governmentBorderSettlement: value })
                  }
                />
              )}
          </div>
        )}
      </Fact>
      <Fact<string | null>
        title="Permit decision date"
        value={facts.permitDecisionDate}
        change={(value) => change({ ...facts, permitDecisionDate: value })}
      >
        {(current, update) => (
          <div className="space-y-2">
            <Input
              type="date"
              aria-label="Permit decision date"
              value={current ?? ""}
              onChange={(event) => update(event.target.value || undefined)}
            />
            <label className="flex gap-2 text-xs">
              <input
                type="checkbox"
                checked={current === null}
                onChange={(event) =>
                  update(event.target.checked ? null : undefined)
                }
              />
              Review found no applicable permit decision
            </label>
            <p className="text-xs text-muted-foreground">
              Use the actual decision date, not a planned construction date.
            </p>
          </div>
        )}
      </Fact>
      <BooleanFact
        title="Valid self-build permit"
        value={facts.validSelfBuildPermit}
        change={(value) => change({ ...facts, validSelfBuildPermit: value })}
      />
    </div>
  );
}

export default function RefundEvidenceEditor({
  value,
  change,
}: {
  value: Refund;
  change: (value: Refund) => void;
}) {
  const [developmentIndex, setDevelopmentIndex] = useState<number | null>(null);
  const [propertyIndex, setPropertyIndex] = useState<number | null>(null);
  const development =
    developmentIndex === null
      ? undefined
      : value.developments[developmentIndex];
  const property =
    propertyIndex === null ? undefined : value.propertyEvidence[propertyIndex];
  function updateDevelopment(next: Development) {
    change({
      ...value,
      developments: value.developments.map((record, index) =>
        index === developmentIndex ? next : record,
      ),
    });
  }
  function updateProperty(next: Property) {
    change({
      ...value,
      propertyEvidence: value.propertyEvidence.map((record, index) =>
        index === propertyIndex ? next : record,
      ),
    });
  }
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Income-tax refund review</h2>
        <p className="text-sm text-muted-foreground">
          Record facts supported by documents. Development records cover shared
          facts; property records identify the exact apartment and mortgage.
          These records help the existing refund engine decide what can be
          calculated. They do not approve a refund.
        </p>
        <label className="flex items-start gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(event) =>
              change({ ...value, enabled: event.target.checked })
            }
          />
          Show income-tax refund tools for mortgages
        </label>
        <p className="text-sm text-muted-foreground">
          Without reviewed evidence, the calculator explains what is missing and
          offers a separate salary-tax estimate. Changing a fact clears its
          verification. Save your changes before previewing.
        </p>
      </div>
      <section className="rounded-xl border p-4 space-y-4">
        <h3 className="font-semibold">
          Development records ({value.developments.length})
        </h3>
        <p className="text-sm text-muted-foreground">
          Optional shared facts about a building or development. These cannot
          verify individual apartment prices, title or mortgage documents.
        </p>
        <label className="block text-sm space-y-2">
          Default development
          <select
            aria-label="Default development"
            className={selectStyle}
            value={value.defaultDevelopmentId ?? ""}
            onChange={(event) =>
              change({
                ...value,
                defaultDevelopmentId: event.target.value || null,
              })
            }
          >
            <option value="">None — use property-specific evidence</option>
            {value.developments
              .filter((item) => item.id)
              .map((item, index) => (
                <option key={index} value={item.id}>
                  {item.name || item.id}
                </option>
              ))}
          </select>
        </label>
        {!value.developments.length && (
          <p className="text-sm">No development evidence recorded.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {value.developments.map((record, index) => (
            <Button
              key={index}
              type="button"
              variant={developmentIndex === index ? "default" : "outline"}
              onClick={() => setDevelopmentIndex(index)}
            >
              Edit development: {record.name || record.id || "New record"}
            </Button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={value.developments.length >= 100}
          onClick={() => {
            setDevelopmentIndex(value.developments.length);
            change({
              ...value,
              developments: [
                ...value.developments,
                { id: "", name: "", facts: {} },
              ],
            });
          }}
        >
          Add development evidence
        </Button>
        {development && (
          <div
            className="border-t pt-4 space-y-4"
            data-testid="development-evidence-editor"
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-sm space-y-2">
                Development ID
                <Input
                  aria-label="Development ID"
                  required
                  pattern="[a-z0-9][a-z0-9-]{1,63}"
                  maxLength={64}
                  value={development.id}
                  onChange={(event) => {
                    const id = event.target.value;
                    change({
                      ...value,
                      defaultDevelopmentId:
                        value.defaultDevelopmentId === development.id &&
                        development.id
                          ? id || null
                          : value.defaultDevelopmentId,
                      developments: value.developments.map((record, index) =>
                        index === developmentIndex
                          ? {
                              ...clearVerification(record),
                              verificationReference: "",
                              id,
                            }
                          : record,
                      ),
                    });
                  }}
                />
              </label>
              <label className="text-sm space-y-2">
                Development name
                <Input
                  aria-label="Development name"
                  required
                  maxLength={120}
                  value={development.name}
                  onChange={(event) =>
                    updateDevelopment({
                      ...development,
                      name: event.target.value,
                    })
                  }
                />
              </label>
            </div>
            <CommonFacts
              facts={development.facts}
              change={(facts) => updateDevelopment({ ...development, facts })}
            />
            <label className="block text-sm space-y-2">
              Development document reference
              <Input
                aria-label="Development document reference"
                maxLength={500}
                value={development.verificationReference ?? ""}
                onChange={(event) =>
                  updateDevelopment({
                    ...development,
                    verificationReference: event.target.value,
                  })
                }
                placeholder="Internal document or review reference (at least 8 characters)"
              />
            </label>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                change({
                  ...value,
                  defaultDevelopmentId:
                    value.defaultDevelopmentId === development.id
                      ? null
                      : value.defaultDevelopmentId,
                  developments: value.developments.filter(
                    (_, index) => index !== developmentIndex,
                  ),
                });
                setDevelopmentIndex(null);
              }}
            >
              Remove development evidence
            </Button>
          </div>
        )}
      </section>
      <section className="rounded-xl border p-4 space-y-4">
        <h3 className="font-semibold">
          Apartment & mortgage records ({value.propertyEvidence.length})
        </h3>
        <p className="text-sm text-muted-foreground">
          Use the same apartment ID that the partner website sends to the SDK.
          Enter factual documents, not the visitor's salary or personal
          eligibility answers.
        </p>
        {!value.propertyEvidence.length && (
          <p className="text-sm">
            No property evidence recorded. Refund eligibility is not confirmed.
          </p>
        )}
        <label className="block text-sm space-y-2">
          Property record
          <select
            aria-label="Property record"
            className={selectStyle}
            value={propertyIndex ?? ""}
            onChange={(event) =>
              setPropertyIndex(
                event.target.value === "" ? null : Number(event.target.value),
              )
            }
          >
            <option value="">Choose an apartment to review</option>
            {value.propertyEvidence.map((record, index) => (
              <option key={index} value={index}>
                {record.apartmentId || "New property record"}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          variant="outline"
          disabled={value.propertyEvidence.length >= 500}
          onClick={() => {
            setPropertyIndex(value.propertyEvidence.length);
            change({
              ...value,
              propertyEvidence: [
                ...value.propertyEvidence,
                { apartmentId: "", facts: {} },
              ],
            });
          }}
        >
          Add property evidence
        </Button>
        {property && (
          <div
            className="border-t pt-4 space-y-4"
            data-testid="property-evidence-editor"
          >
            <label className="block text-sm space-y-2">
              Apartment ID
              <Input
                aria-label="Apartment ID"
                required
                maxLength={120}
                value={property.apartmentId}
                onChange={(event) =>
                  updateProperty({
                    ...clearVerification(property),
                    verificationReference: "",
                    apartmentId: event.target.value,
                  })
                }
                placeholder="A-101"
              />
            </label>
            <CommonFacts
              facts={property.facts}
              change={(facts) => updateProperty({ ...property, facts })}
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <Fact<number>
                title="Contract price in AMD"
                value={property.facts.contractPriceAMD}
                change={(fact) =>
                  updateProperty({
                    ...property,
                    facts: { ...property.facts, contractPriceAMD: fact },
                  })
                }
              >
                {(current, update) => (
                  <Input
                    type="number"
                    aria-label="Contract price in AMD"
                    min={1}
                    max={1e12}
                    step={1}
                    value={current ?? ""}
                    onChange={(event) =>
                      update(
                        event.target.value === ""
                          ? undefined
                          : Number(event.target.value),
                      )
                    }
                  />
                )}
              </Fact>
              <Fact<string>
                title="Mortgage origination date"
                value={property.loanOriginationDate}
                change={(fact) =>
                  updateProperty({ ...property, loanOriginationDate: fact })
                }
              >
                {(current, update) => (
                  <Input
                    type="date"
                    aria-label="Mortgage origination date"
                    value={current ?? ""}
                    onChange={(event) =>
                      update(event.target.value || undefined)
                    }
                  />
                )}
              </Fact>
              {(
                [
                  ["residentFinancialLender", "Resident financial lender"],
                  ["fundsUsedForHousing", "Loan funds used for housing"],
                  ["propertyRightsRegistered", "Property rights registered"],
                  [
                    "requiredDocumentsAvailable",
                    "Required property and mortgage documents available",
                  ],
                ] as const
              ).map(([key, title]) => (
                <BooleanFact
                  key={key}
                  title={title}
                  value={property.facts[key]}
                  change={(fact) =>
                    updateProperty({
                      ...property,
                      facts: { ...property.facts, [key]: fact },
                    })
                  }
                />
              ))}
              <BooleanFact
                title="No mortgage interest subsidy"
                value={property.noInterestSubsidy}
                change={(fact) =>
                  updateProperty({ ...property, noInterestSubsidy: fact })
                }
              />
            </div>
            <label className="block text-sm space-y-2">
              Property document reference
              <Input
                aria-label="Property document reference"
                maxLength={500}
                value={property.verificationReference ?? ""}
                onChange={(event) =>
                  updateProperty({
                    ...property,
                    verificationReference: event.target.value,
                  })
                }
                placeholder="Internal document or review reference (at least 8 characters)"
              />
            </label>
            <p className="text-xs text-muted-foreground">
              References stay in the staff API. Do not include salary,
              unnecessary personal data or public document-sharing secrets.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                change({
                  ...value,
                  propertyEvidence: value.propertyEvidence.filter(
                    (_, index) => index !== propertyIndex,
                  ),
                });
                setPropertyIndex(null);
              }}
            >
              Remove property evidence
            </Button>
          </div>
        )}
      </section>
      <p className="text-sm">
        Save this review, then use the exact apartment ID in SDK & preview.
        Recorded facts are never automatically treated as verified.
      </p>
    </div>
  );
}
