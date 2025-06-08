'use client';

import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { TeacherOption } from '@/types/assignment';

interface TeacherSelectProps {
  teachers: TeacherOption[];
  value: string;
  onChange: (teacherId: string) => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  excludeIds?: string[]; // 除外する講師ID（既に割り当て済みの講師を除外）
  disabled?: boolean;
  className?: string;
}

export default function TeacherSelect({
  teachers,
  value,
  onChange,
  placeholder = '講師を選択',
  size = 'md',
  excludeIds = [],
  disabled = false,
  className = ''
}: TeacherSelectProps) {
  
  // 利用可能な講師をフィルター
  const availableTeachers = teachers.filter(teacher => 
    teacher.isAvailable && 
    teacher.account_status === '有効' &&
    !excludeIds.includes(teacher.id)
  );

  const selectedTeacher = teachers.find(t => t.id === value);

  const sizeClasses = {
    sm: 'text-xs py-1 px-2',
    md: 'text-sm py-2 px-3',
    lg: 'text-base py-3 px-4'
  };

  const buttonSizeClasses = {
    sm: 'h-7 min-w-[120px]',
    md: 'h-9 min-w-[140px]',
    lg: 'h-11 min-w-[160px]'
  };

  return (
    <div className={className}>
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <Listbox.Button
            className={`
              relative w-full cursor-default rounded-md border border-gray-300 bg-white
              ${sizeClasses[size]} ${buttonSizeClasses[size]}
              text-left shadow-sm 
              focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
              ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'hover:border-gray-400'}
            `}
          >
            <span className="block truncate">
              {selectedTeacher ? (
                <span className="flex items-center">
                  <span className="text-gray-900">{selectedTeacher.full_name}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({selectedTeacher.currentAssignments}人担当)
                  </span>
                </span>
              ) : (
                <span className="text-gray-400">{placeholder}</span>
              )}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-4 w-4 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {!value && (
                <Listbox.Option
                  value=""
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-3 pr-9 ${
                      active ? 'bg-blue-600 text-white' : 'text-gray-900'
                    }`
                  }
                >
                  <span className="block truncate text-gray-400">
                    {placeholder}
                  </span>
                </Listbox.Option>
              )}
              
              {availableTeachers.length === 0 ? (
                <div className="py-2 px-3 text-sm text-gray-500">
                  利用可能な講師がいません
                </div>
              ) : (
                availableTeachers.map((teacher) => (
                  <Listbox.Option
                    key={teacher.id}
                    value={teacher.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-3 pr-9 ${
                        active ? 'bg-blue-600 text-white' : 'text-gray-900'
                      }`
                    }
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span
                              className={`block truncate ${
                                selected ? 'font-medium' : 'font-normal'
                              }`}
                            >
                              {teacher.full_name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-xs ${
                                active ? 'text-white' : 'text-gray-500'
                              }`}
                            >
                              {teacher.currentAssignments}人担当
                            </span>
                            {teacher.currentAssignments >= 10 && (
                              <span
                                className={`text-xs px-1 py-0.5 rounded ${
                                  active 
                                    ? 'bg-white text-orange-600' 
                                    : 'bg-orange-100 text-orange-600'
                                }`}
                              >
                                多忙
                              </span>
                            )}
                          </div>
                        </div>

                        {selected ? (
                          <span
                            className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                              active ? 'text-white' : 'text-blue-600'
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))
              )}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}